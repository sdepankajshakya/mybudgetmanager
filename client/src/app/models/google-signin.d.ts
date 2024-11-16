interface GoogleSignIn {
    accounts: {
        id: {
            initialize: (config: any) => void;
            renderButton: (container: HTMLElement, options: any) => void;
            prompt: () => void;
        };
    };
}

interface Window {
    google: GoogleSignIn;
}