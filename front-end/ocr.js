// OCR functionality using Tesseract.js
class OCRProcessor {
    constructor() {
        this.worker = null;
        this.isProcessing = false;
        this.isInitializing = false;
        this.initTimeout = 60000; // 60 seconds timeout - increased for better reliability
    }

    async initialize() {
        if (this.worker) return; // Already initialized
        if (this.isInitializing) {
            // Wait for existing initialization to complete
            while (this.isInitializing && this.initTimeout > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
                this.initTimeout -= 500;
            }
            return;
        }

        this.isInitializing = true;
        try {
            console.log('Starting OCR worker initialization...');

            // Check if Tesseract is available
            if (typeof Tesseract === 'undefined') {
                throw new Error('Tesseract.js library not loaded. Please check your internet connection.');
            }

            // Create worker without logger to avoid DataCloneError
            console.log('Creating Tesseract worker...');
            this.worker = await Promise.race([
                Tesseract.createWorker(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('OCR worker creation timeout after 60 seconds')), this.initTimeout)
                )
            ]);

            console.log('Worker created successfully');

            console.log('Loading OCR language models (this may take a few moments)...');

            // Try different language combinations for better reliability - Vietnamese first
            const languages = ['vie', 'eng']; // Vietnamese first as default

            try {
                await Promise.race([
                    this.worker.loadLanguage('vie+eng'),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Language loading timeout')), 45000)
                    )
                ]);
            } catch (langError) {
                console.warn('Failed to load combined languages, trying Vietnamese only:', langError);
                await this.worker.loadLanguage('vie');
            }

            console.log('Initializing OCR engine...');
            try {
                await Promise.race([
                    this.worker.initialize('vie+eng'),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('OCR initialization timeout')), 30000)
                    )
                ]);
            } catch (initError) {
                console.warn('Failed to initialize with combined languages, trying Vietnamese only:', initError);
                await this.worker.initialize('vie');
            }

            console.log('OCR initialization complete successfully');
        } catch (error) {
            console.error('OCR initialization failed:', error);
            if (this.worker) {
                try {
                    await this.worker.terminate();
                } catch (e) {
                    console.error('Error terminating worker:', e);
                }
                this.worker = null;
            }

            // Provide more specific error messages
            let errorMessage = 'OCR initialization failed';
            if (error.message.includes('timeout')) {
                errorMessage = 'OCR initialization timed out. This usually means slow internet connection. Please try again or check your connection.';
            } else if (error.message.includes('Tesseract.js library not loaded')) {
                errorMessage = 'OCR library failed to load. Please refresh the page and check your internet connection.';
            } else if (error.message.includes('loading') || error.message.includes('downloading')) {
                errorMessage = 'Failed to download OCR models. Please check your internet connection and try again.';
            } else {
                errorMessage += ': ' + error.message;
            }

            throw new Error(errorMessage);
        } finally {
            this.isInitializing = false;
        }
    } async processImage(imageFile) {
        if (this.isProcessing) {
            throw new Error('OCR is already processing an image');
        }

        try {
            this.isProcessing = true;
            console.log('Processing image:', imageFile.name);

            await this.initialize();

            if (!this.worker) {
                throw new Error('OCR worker not initialized');
            }

            console.log('Starting text recognition...');
            const { data: { text } } = await this.worker.recognize(imageFile);
            console.log('Text recognition complete, extracted length:', text.length);

            return text.trim();
        } catch (error) {
            console.error('OCR processing error:', error);
            throw new Error(`Failed to process image: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    async terminate() {
        if (this.worker) {
            try {
                console.log('Terminating OCR worker...');
                await this.worker.terminate();
                console.log('OCR worker terminated');
            } catch (error) {
                console.error('Error terminating OCR worker:', error);
            }
            this.worker = null;
        }
    }

    getProcessingStatus() {
        return {
            isProcessing: this.isProcessing,
            isInitializing: this.isInitializing,
            isReady: !!this.worker && !this.isInitializing
        };
    }
}

// Export for use in main.js
window.OCRProcessor = OCRProcessor;
