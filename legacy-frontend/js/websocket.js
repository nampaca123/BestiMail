class WebSocketService {
    constructor() {
        this.socket = io('http://localhost:5000');
        this.setupListeners();
    }

    setupListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        this.socket.on('grammar_result', (data) => {
            if (this.onGrammarResult) {
                this.onGrammarResult(data.corrected_text);
            }
        });

        this.socket.on('formalize_result', (data) => {
            if (this.onFormalizeResult) {
                this.onFormalizeResult(data.formalized_text);
            }
        });
    }

    checkGrammar(text) {
        this.socket.emit('check_grammar', { text });
    }

    formalizeText(text) {
        this.socket.emit('formalize', { text });
    }

    setGrammarCallback(callback) {
        this.onGrammarResult = callback;
    }

    setFormalizeCallback(callback) {
        this.onFormalizeResult = callback;
    }
}

export const wsService = new WebSocketService(); 