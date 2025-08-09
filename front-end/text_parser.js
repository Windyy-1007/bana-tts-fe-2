// Text parser for various file formats
class TextParser {
    constructor() {
        this.supportedFormats = ['.txt', '.docx'];
    }

    async parseFile(file) {
        const fileExtension = this.getFileExtension(file.name);

        switch (fileExtension) {
            case '.txt':
                return await this.parseTxtFile(file);
            case '.docx':
                return await this.parseDocxFile(file);
            default:
                throw new Error(`Unsupported file format: ${fileExtension}`);
        }
    }

    getFileExtension(filename) {
        return filename.substring(filename.lastIndexOf('.')).toLowerCase();
    }

    async parseTxtFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    resolve(text.trim());
                } catch (error) {
                    reject(new Error('Failed to parse text file: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    }

    async parseDocxFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    resolve(result.value.trim());
                } catch (error) {
                    reject(new Error('Failed to parse DOCX file: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read DOCX file'));
            reader.readAsArrayBuffer(file);
        });
    }

    isValidFileType(file) {
        const extension = this.getFileExtension(file.name);
        return this.supportedFormats.includes(extension);
    }

    getValidExtensions() {
        return this.supportedFormats.join(', ');
    }
}

// Export for use in main.js
window.TextParser = TextParser;
