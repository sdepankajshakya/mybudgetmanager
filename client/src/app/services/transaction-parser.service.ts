import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ParsedTransaction {
  amount?: number;
  currency?: string;
  category?: string;
  date?: Date;
  paymentMode?: string;
  note?: string;
  originalText: string;
  confidence: number;
}

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionParserService {
  private recognition: any;
  private isListening = new BehaviorSubject<boolean>(false);
  
  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Use non-continuous mode for automatic stopping
      this.recognition.continuous = false;
      this.recognition.interimResults = true; // Enable interim results for live transcription
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  startListening(): Observable<SpeechResult> {
    return new Observable(observer => {
      if (!this.recognition) {
        observer.error('Speech recognition not supported');
        return () => {}; // Return empty cleanup function
      }

      this.recognition.onstart = () => {
        this.isListening.next(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Emit interim results for live transcription
        if (interimTranscript) {
          observer.next({
            transcript: interimTranscript,
            isFinal: false
          });
        }

        // Emit final result when available
        if (finalTranscript) {
          observer.next({
            transcript: finalTranscript.trim(),
            isFinal: true
          });
          observer.complete();
        }
      };

      this.recognition.onerror = (error: any) => {
        this.isListening.next(false);
        observer.error(error);
      };

      this.recognition.onend = () => {
        this.isListening.next(false);
        
        // If we haven't completed yet, complete now
        if (!observer.closed) {
          observer.complete();
        }
      };

      // Start the recognition
      this.recognition.start();

      // Cleanup function
      return () => {
        if (this.recognition) {
          this.recognition.stop();
        }
      };
    });
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening.next(false);
    }
  }

  isCurrentlyListening(): Observable<boolean> {
    return this.isListening.asObservable();
  }

  parseTransactionText(text: string, availableCategories: any[] = [], availablePaymentModes: any[] = []): ParsedTransaction {
    const parsed: ParsedTransaction = {
      originalText: text,
      confidence: 0
    };

    const lowerText = text.toLowerCase();
    
    // Parse Amount
    const amountMatch = lowerText.match(/(\d+(?:\.\d{2})?)\s*(?:rupees?|dollars?|\$|₹|rs\.?)?/i);
    if (amountMatch) {
      parsed.amount = parseFloat(amountMatch[1]);
      parsed.confidence += 0.4;
    }

    // Parse Currency
    if (lowerText.includes('rupees') || lowerText.includes('₹') || lowerText.includes('rs')) {
      parsed.currency = 'INR';
      parsed.confidence += 0.1;
    } else if (lowerText.includes('dollars') || lowerText.includes('$')) {
      parsed.currency = 'USD';
      parsed.confidence += 0.1;
    }

    // Parse Date - Enhanced with more natural language support
    const datePatterns = [
      { pattern: /\btoday\b/i, date: new Date() },
      { pattern: /\byesterday\b/i, date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { pattern: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, date: null }, // MM/DD/YYYY or DD/MM/YYYY
      { pattern: /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i, date: null },
      { pattern: /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i, date: null },
      { pattern: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, date: null },
      { pattern: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})/i, date: null },
      { pattern: /(\d+)\s+days?\s+ago/i, date: null },
      { pattern: /(\d+)\s+weeks?\s+ago/i, date: null },
      { pattern: /last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, date: null },
      { pattern: /this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, date: null }
    ];

    for (const { pattern, date } of datePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        if (date) {
          parsed.date = date;
          parsed.confidence += 0.2;
        } else {
          // Handle specific date parsing based on pattern
          let parsedDate = null;
          
          if (pattern.source.includes('\\d{1,2}[\\\/\\-]\\d{1,2}[\\\/\\-]\\d{2,4}')) {
            // MM/DD/YYYY or DD/MM/YYYY format
            const [, first, second, year] = match;
            const fullYear = year.length === 2 ? 2000 + parseInt(year) : parseInt(year);
            parsedDate = new Date(fullYear, parseInt(first) - 1, parseInt(second));
          } else if (pattern.source.includes('january|february')) {
            // Month name patterns
            const months = ['january', 'february', 'march', 'april', 'may', 'june',
                          'july', 'august', 'september', 'october', 'november', 'december'];
            const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                               'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            
            let monthIndex = -1;
            let day = 0;
            
            if (match[1] && !isNaN(parseInt(match[1]))) {
              // Day first: "15 September"
              day = parseInt(match[1]);
              const monthName = match[2].toLowerCase();
              monthIndex = months.indexOf(monthName);
              if (monthIndex === -1) monthIndex = shortMonths.indexOf(monthName);
            } else if (match[2] && !isNaN(parseInt(match[2]))) {
              // Month first: "September 15"
              day = parseInt(match[2]);
              const monthName = match[1].toLowerCase();
              monthIndex = months.indexOf(monthName);
              if (monthIndex === -1) monthIndex = shortMonths.indexOf(monthName);
            }
            
            if (monthIndex !== -1 && day > 0) {
              const currentYear = new Date().getFullYear();
              parsedDate = new Date(currentYear, monthIndex, day);
            }
          } else if (pattern.source.includes('days?\\s+ago')) {
            // "X days ago"
            const daysAgo = parseInt(match[1]);
            parsedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          } else if (pattern.source.includes('weeks?\\s+ago')) {
            // "X weeks ago"
            const weeksAgo = parseInt(match[1]);
            parsedDate = new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
          } else if (pattern.source.includes('last\\s+')) {
            // "last Monday", "last Tuesday", etc.
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = dayNames.indexOf(match[1].toLowerCase());
            if (targetDay !== -1) {
              const today = new Date();
              const currentDay = today.getDay();
              let daysBack = currentDay - targetDay;
              if (daysBack <= 0) daysBack += 7; // Go to previous week
              parsedDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
            }
          } else if (pattern.source.includes('this\\s+')) {
            // "this Monday", "this Tuesday", etc.
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = dayNames.indexOf(match[1].toLowerCase());
            if (targetDay !== -1) {
              const today = new Date();
              const currentDay = today.getDay();
              let daysAhead = targetDay - currentDay;
              if (daysAhead < 0) daysAhead += 7; // Go to next week if day already passed
              parsedDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
            }
          }
          
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            parsed.date = parsedDate;
            parsed.confidence += 0.2;
          }
        }
        break;
      }
    }

    // Parse Category (fuzzy matching against available categories)
    let matchedCategory = null;
    let categoryText = '';
    
    if (availableCategories.length > 0) {
      matchedCategory = this.findBestCategoryMatch(lowerText, availableCategories);
      if (matchedCategory) {
        parsed.category = matchedCategory.name;
        parsed.confidence += 0.2;
        categoryText = (matchedCategory.name && typeof matchedCategory.name === 'string') ? matchedCategory.name.toLowerCase() : '';
      }
    }

    // Parse Payment Mode (check against available payment modes first)
    let matchedPaymentMode = null;
    let paymentModeText = '';
    
    if (availablePaymentModes.length > 0) {
      matchedPaymentMode = this.findBestPaymentModeMatch(lowerText, availablePaymentModes);
      if (matchedPaymentMode) {
        // Always use the name for consistency, as type is numeric
        parsed.paymentMode = matchedPaymentMode.name || matchedPaymentMode.type?.toString();
        parsed.confidence += 0.1;
        paymentModeText = (matchedPaymentMode.name && typeof matchedPaymentMode.name === 'string') ? matchedPaymentMode.name.toLowerCase() : '';
      }
    }
    
    // If no payment mode found in available modes, try common patterns
    if (!matchedPaymentMode) {
      const paymentPatterns = [
        { keywords: ['cash'], mode: 'Cash' },
        { keywords: ['credit card', 'credit'], mode: 'Credit Card' },
        { keywords: ['debit card', 'debit'], mode: 'Debit Card' },
        { keywords: ['upi', 'gpay', 'paytm', 'phonepe'], mode: 'UPI' }
      ];

      for (const { keywords, mode } of paymentPatterns) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
          // Check if this mode exists in available payment modes
          const availableMode = availablePaymentModes.find(pm => 
            (pm.name && typeof pm.name === 'string' && pm.name.toLowerCase() === mode.toLowerCase()) || 
            (pm.type && typeof pm.type === 'string' && pm.type.toLowerCase() === mode.toLowerCase())
          );
          
          if (availableMode) {
            // Always use the name for consistency, as type is numeric
            parsed.paymentMode = availableMode.name || availableMode.type?.toString();
            parsed.confidence += 0.1;
            paymentModeText = keywords.find(k => lowerText.includes(k)) || '';
          }
          break;
        }
      }
    }

    // Extract note with fallback logic
    let noteText = text;
    let unmatchedTerms: string[] = [];
    
    // Remove amount from note
    if (parsed.amount) {
      noteText = noteText.replace(/(\d+(?:\.\d{2})?)\s*(?:rupees?|dollars?|\$|₹|rs\.?)?/i, '');
    }
    
    // Remove matched category from note, but add unmatched category-like terms to note
    if (parsed.category && categoryText) {
      noteText = noteText.replace(new RegExp(categoryText, 'i'), '');
    } else {
      // Look for potential category terms that weren't matched
      const potentialCategories = this.extractPotentialCategories(lowerText);
      unmatchedTerms.push(...potentialCategories);
    }
    
    // Remove matched payment mode from note, but add unmatched payment-like terms to note
    if (parsed.paymentMode && paymentModeText) {
      noteText = noteText.replace(new RegExp(paymentModeText, 'i'), '');
    } else {
      // Look for potential payment mode terms that weren't matched
      const potentialPaymentModes = this.extractPotentialPaymentModes(lowerText);
      unmatchedTerms.push(...potentialPaymentModes);
    }
    
    // Remove dates from note
    if (parsed.date) {
      noteText = noteText.replace(/\b(today|yesterday|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi, '');
    }
    
    // Clean up common words and extra spaces
    noteText = noteText.replace(/\b(spent|paid|bought|for|on|via|using|with|the|a|an)\b/gi, '')
                     .replace(/\s+/g, ' ')
                     .trim();
    
    // Combine cleaned note with unmatched terms
    const finalNoteTerms = [];
    if (noteText.length > 2) {
      finalNoteTerms.push(noteText);
    }
    finalNoteTerms.push(...unmatchedTerms);
    
    if (finalNoteTerms.length > 0) {
      parsed.note = finalNoteTerms.join(' ').trim();
    }

    return parsed;
  }

  private findBestCategoryMatch(text: string, categories: any[]): any | null {
    let bestMatch = null;
    let bestScore = 0;

    for (const category of categories) {
      // Safely handle category name with strong type checking
      const categoryName = (category.name && typeof category.name === 'string') ? category.name.toLowerCase() : '';
      
      // Skip if no name
      if (!categoryName) {
        continue;
      }
      
      // Exact match
      if (text.includes(categoryName)) {
        return category;
      }
      
      // Partial match scoring
      const words = categoryName.split(' ');
      let score = 0;
      
      for (const word of words) {
        if (word && text.includes(word)) {
          score += word.length;
        }
      }
      
      if (score > bestScore && score > 2) {
        bestScore = score;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  private findBestPaymentModeMatch(text: string, paymentModes: any[]): any | null {
    let bestMatch = null;
    let bestScore = 0;

    for (const paymentMode of paymentModes) {
      // Safely handle name and type properties with strong type checking
      const modeName = (paymentMode.name && typeof paymentMode.name === 'string') ? paymentMode.name.toLowerCase() : '';
      const modeType = (paymentMode.type && typeof paymentMode.type === 'string') ? paymentMode.type.toLowerCase() : '';
      
      // Skip if both name and type are empty
      if (!modeName && !modeType) {
        continue;
      }
      
      // Exact match on name or type
      if ((modeName && text.includes(modeName)) || (modeType && text.includes(modeType))) {
        return paymentMode;
      }
      
      // Partial match scoring for name
      let score = 0;
      if (modeName) {
        const nameWords = modeName.split(' ');
        for (const word of nameWords) {
          if (word && text.includes(word)) {
            score += word.length;
          }
        }
      }
      
      // Also check type if available
      if (modeType) {
        const typeWords = modeType.split(' ');
        for (const word of typeWords) {
          if (word && text.includes(word)) {
            score += word.length;
          }
        }
      }
      
      if (score > bestScore && score > 2) {
        bestScore = score;
        bestMatch = paymentMode;
      }
    }

    return bestMatch;
  }

  private extractPotentialCategories(text: string): string[] {
    const potentialCategories: string[] = [];
    
    // Common category-like words that might not be in the user's category list
    const categoryKeywords = [
      'food', 'groceries', 'shopping', 'transport', 'transportation', 'travel',
      'entertainment', 'dining', 'restaurant', 'gas', 'fuel', 'clothes', 'clothing',
      'medical', 'healthcare', 'medicine', 'bills', 'utilities', 'rent',
      'education', 'books', 'coffee', 'snacks', 'movies', 'gym', 'fitness'
    ];
    
    for (const keyword of categoryKeywords) {
      if (text.includes(keyword)) {
        potentialCategories.push(keyword);
      }
    }
    
    return potentialCategories;
  }

  private extractPotentialPaymentModes(text: string): string[] {
    const potentialPaymentModes: string[] = [];
    
    // Common payment mode keywords that might not be in the user's payment mode list
    const paymentKeywords = [
      'cash', 'credit', 'debit', 'card', 'upi', 'gpay', 'paytm', 'phonepe',
      'paypal', 'venmo', 'apple pay', 'google pay', 'online', 'bank transfer',
      'check', 'cheque', 'wallet', 'bitcoin', 'crypto'
    ];
    
    for (const keyword of paymentKeywords) {
      if (text.includes(keyword)) {
        potentialPaymentModes.push(keyword);
      }
    }
    
    return potentialPaymentModes;
  }
}