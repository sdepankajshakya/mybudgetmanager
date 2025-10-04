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

    // Initialize note text early for processing
    let noteText = text;

    // Parse Category (fuzzy matching against available categories)
    let matchedCategory = null;
    let categoryText = '';
    
    if (availableCategories.length > 0) {
      matchedCategory = this.findBestCategoryMatch(lowerText, availableCategories);
      if (matchedCategory) {
        parsed.category = matchedCategory.name;
        parsed.confidence += 0.2;
        categoryText = (matchedCategory.name && typeof matchedCategory.name === 'string') ? matchedCategory.name.toLowerCase() : '';
        
        // Also remove category indicators from the text for better note extraction
        noteText = noteText.replace(/\b(category|cat)\s+(is|was|are|were)?\s*/gi, '');
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
        
        // Remove payment mode indicators from note text
        noteText = noteText.replace(/\b(mode of payment|payment mode|paid via|paid using|using|via)\s+(is|was|are|were)?\s*/gi, '');
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
    
    // Remove amount from note
    if (parsed.amount) {
      noteText = noteText.replace(/(\d+(?:\.\d{2})?)\s*(?:rupees?|dollars?|\$|₹|rs\.?)?/i, '');
    }
    
    // Remove matched category from note
    if (parsed.category && categoryText) {
      noteText = noteText.replace(new RegExp(categoryText, 'i'), '');
    }
    
    // Remove matched payment mode from note
    if (parsed.paymentMode && paymentModeText) {
      noteText = noteText.replace(new RegExp(paymentModeText, 'i'), '');
    }
    
    // Remove dates from note
    if (parsed.date) {
      noteText = noteText.replace(/\b(today|yesterday|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi, '');
      // Remove date-related phrases
      noteText = noteText.replace(/\b(on|from|date|dated|day|days?\s+ago|weeks?\s+ago|last\s+\w+|this\s+\w+)\b/gi, '');
    }
    
    // Remove field indicators and common transaction phrases
    noteText = noteText.replace(/\b(spent|paid|bought|for|on|via|using|with|the|a|an)\b/gi, '')
                     .replace(/\b(mode of payment|payment mode|category|amount|rupees?|dollars?|rs\.?|\$|₹)\b/gi, '')
                     .replace(/\b(is|was|were|are)\b/gi, '') // Remove linking verbs
                     .replace(/\s+/g, ' ')
                     .trim();
    
    // Only use the cleaned note text if it has meaningful content
    if (noteText.length > 2) {
      parsed.note = noteText;
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
      
      // Check for plural/singular variations
      const pluralVariations = this.generateWordVariations(categoryName);
      for (const variation of pluralVariations) {
        if (text.includes(variation)) {
          return category;
        }
      }
      
      // Partial match scoring
      const words = categoryName.split(' ');
      let score = 0;
      
      for (const word of words) {
        if (word && text.includes(word)) {
          score += word.length;
        }
        
        // Also check variations of each word
        const wordVariations = this.generateWordVariations(word);
        for (const variation of wordVariations) {
          if (text.includes(variation)) {
            score += word.length * 0.9; // Slightly lower score for variations
          }
        }
      }
      
      if (score > bestScore && score > 2) {
        bestScore = score;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  private generateWordVariations(word: string): string[] {
    const variations = [word];
    
    // Handle plural to singular
    if (word.endsWith('ies')) {
      variations.push(word.slice(0, -3) + 'y'); // groceries -> grocery
    } else if (word.endsWith('es')) {
      variations.push(word.slice(0, -2)); // clothes -> cloth
    } else if (word.endsWith('s') && word.length > 3) {
      variations.push(word.slice(0, -1)); // books -> book
    }
    
    // Handle singular to plural
    if (word.endsWith('y') && word.length > 2) {
      variations.push(word.slice(0, -1) + 'ies'); // grocery -> groceries
    } else if (!word.endsWith('s')) {
      variations.push(word + 's'); // book -> books
      variations.push(word + 'es'); // cloth -> clothes
    }
    
    return variations;
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
}