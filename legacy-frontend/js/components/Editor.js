import { wsService } from '../websocket.js';
import { showToast } from './Toast.js';

export class Editor {
    constructor() {
        // DOM 요소들이 모두 로드된 후에 초기화
        this.editor = document.querySelector('.editor__content');
        if (!this.editor) {
            console.error('Editor content element not found');
            return;
        }

        this.overallFixBtn = document.querySelector('.btn--overall-fix');
        if (!this.overallFixBtn) {
            console.error('Overall fix button not found');
            return;
        }

        // 나머지 초기화 진행
        this.setupListeners();
        this.setupWebSocket();
        this.setupToolbar();
        this.setupAttachments();
    }

    setupListeners() {
        this.overallFixBtn.addEventListener('click', () => {
            const text = this.editor.textContent;
            wsService.formalizeText(text);
            showToast('Improving overall writing...', 'info');
        });

        // 실시간 문법 체크를 위한 디바운스 설정
        let timeout;
        this.editor.addEventListener('input', (e) => {
            if (e.inputType === 'insertText' || e.inputType === 'deleteContentBackward') {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const currentWord = this.getCurrentWord(range);
                
                if (currentWord) {
                    this.highlightWord(currentWord, 'error');
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        wsService.checkGrammar(currentWord.text);
                    }, 500);
                }
            }
        });
    }

    getCurrentWord(range) {
        const text = range.startContainer.textContent;
        const position = range.startOffset;
        
        // 현재 커서 위치의 단어 찾기
        const words = text.split(/\s+/);
        let charCount = 0;
        for (let i = 0; i < words.length; i++) {
            charCount += words[i].length + 1;
            if (charCount >= position) {
                return {
                    text: words[i],
                    node: range.startContainer,
                    index: i
                };
            }
        }
        return null;
    }

    highlightWord(wordInfo, type) {
        const span = document.createElement('span');
        span.textContent = wordInfo.text;
        span.className = `highlight highlight--${type}`;
        
        const text = wordInfo.node.textContent;
        const words = text.split(/\s+/);
        words[wordInfo.index] = span.outerHTML;
        wordInfo.node.textContent = words.join(' ');
        
        setTimeout(() => {
            span.classList.remove(`highlight--${type}`);
        }, 1000);
    }

    setupWebSocket() {
        wsService.setGrammarCallback((correctedText) => {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const currentWord = this.getCurrentWord(range);
            
            if (currentWord && correctedText !== currentWord.text) {
                this.highlightWord({
                    text: correctedText,
                    node: currentWord.node,
                    index: currentWord.index
                }, 'success');
            }
        });

        wsService.setFormalizeCallback((formalText) => {
            this.editor.textContent = formalText;
            showToast('Writing improved!', 'success');
        });
    }

    setupToolbar() {
        const buttons = document.querySelectorAll('.btn--toolbar');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const command = button.dataset.command;
                this.editor.focus(); // 편집 영역에 포커스를 줍니다
                document.execCommand(command, false, null);
                
                // 토글 버튼 상태 업데이트
                if (['bold', 'italic', 'underline'].includes(command)) {
                    button.classList.toggle('active');
                }
                this.updateToolbarState();
            });
        });

        // 현재 선택된 텍스트 스타일 상태 업데이트
        this.editor.addEventListener('keyup', this.updateToolbarState.bind(this));
        this.editor.addEventListener('mouseup', this.updateToolbarState.bind(this));
    }

    updateToolbarState() {
        const commands = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight'];
        commands.forEach(command => {
            const button = document.querySelector(`[data-command="${command}"]`);
            if (button) {
                try {
                    const state = document.queryCommandState(command);
                    button.classList.toggle('active', state);
                } catch (e) {
                    console.warn(`Command state check failed for: ${command}`);
                }
            }
        });
    }

    setupAttachments() {
        // 파일 첨부 버튼
        const attachBtn = document.querySelector('.btn--attachment:first-child');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        attachBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                this.attachFile(file);
            });
        });

        // 이미지 첨부 버튼
        const imageBtn = document.querySelector('.btn--attachment:last-child');
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.multiple = true;
        imageInput.style.display = 'none';
        document.body.appendChild(imageInput);

        imageBtn.addEventListener('click', () => {
            imageInput.click();
        });

        imageInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                this.attachImage(file);
            });
        });
    }

    attachFile(file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'attachment';
        fileElement.innerHTML = `
            <span class="material-icons">attach_file</span>
            <span>${file.name}</span>
            <button class="btn btn--icon btn--small btn--remove">
                <span class="material-icons">close</span>
            </button>
        `;
        
        // 파일 삭제 기능 추가
        const removeBtn = fileElement.querySelector('.btn--remove');
        removeBtn.addEventListener('click', () => fileElement.remove());
        
        // 본문 맨 앞에 첨부 파일 추가
        this.editor.insertBefore(fileElement, this.editor.firstChild);
    }

    attachImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'editor-image';
            
            // 현재 커서 위치에 이미지 삽입
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            range.insertNode(img);
            range.collapse(false);
        };
        reader.readAsDataURL(file);
    }
} 