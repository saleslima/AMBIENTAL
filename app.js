import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

const firebaseConfig = {
  apiKey: "AIzaSyCKYnLyv1jfyQ-gpjdWo3eIELt0dVwq_e0",
  authDomain: "ambiental-13fc9.firebaseapp.com",
  projectId: "ambiental-13fc9",
  databaseURL: "https://ambiental-13fc9-default-rtdb.firebaseio.com/",
  storageBucket: "ambiental-13fc9.firebasestorage.app",
  messagingSenderId: "80561158950",
  appId: "1:80561158950:web:81b37c9dcefc334cffdfe7",
  measurementId: "G-GEF53KC3DN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

class FormHandler {
    constructor() {
        this.form = document.getElementById('ocorrenciaForm');
        this.submitButton = document.querySelector('.btn-salvar');
        this.isAdminLoggedIn = false;
        this.init();
        this.initAdmin();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.addInputValidation();
    }

    initAdmin() {
        const adminBtn = document.getElementById('adminBtn');
        const adminModal = document.getElementById('adminModal');
        const closeBtn = document.querySelector('.close');
        const adminLoginForm = document.getElementById('adminLoginForm');
        const logoutBtn = document.getElementById('logoutBtn');

        adminBtn.addEventListener('click', () => {
            adminModal.style.display = 'block';
        });

        closeBtn.addEventListener('click', () => {
            adminModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === adminModal) {
                adminModal.style.display = 'none';
            }
        });

        adminLoginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
        logoutBtn.addEventListener('click', this.handleLogout.bind(this));
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const user = document.getElementById('adminUser').value;
        const password = document.getElementById('adminPassword').value;

        if (user === 'copom' && password === 'salu126') {
            this.isAdminLoggedIn = true;
            document.getElementById('adminModal').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            document.querySelector('.form-container').style.display = 'none';
            
            await this.loadAllRecords();
            
            // Clear login form
            document.getElementById('adminLoginForm').reset();
        } else {
            alert('Usuário ou senha incorretos!');
        }
    }

    handleLogout() {
        this.isAdminLoggedIn = false;
        document.getElementById('adminPanel').style.display = 'none';
        document.querySelector('.form-container').style.display = 'block';
    }

    async loadAllRecords() {
        const container = document.getElementById('recordsContainer');
        container.innerHTML = '<div class="loading">Carregando registros...</div>';

        try {
            const { get, remove } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            const ocorrenciasRef = ref(database, 'ocorrencias');
            const snapshot = await get(ocorrenciasRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Remove records older than 24 hours
                const now = new Date();
                const recordsToDelete = [];
                
                Object.entries(data).forEach(([key, record]) => {
                    if (record.timestamp) {
                        const recordTime = new Date(record.timestamp);
                        const hoursDiff = (now - recordTime) / (1000 * 60 * 60);
                        
                        if (hoursDiff >= 24) {
                            recordsToDelete.push(key);
                        }
                    }
                });
                
                // Delete old records
                for (const key of recordsToDelete) {
                    await remove(ref(database, `ocorrencias/${key}`));
                    delete data[key];
                }
                
                if (Object.keys(data).length > 0) {
                    this.displayRecords(data);
                } else {
                    container.innerHTML = '<div class="no-records">Nenhum registro encontrado.</div>';
                }
            } else {
                container.innerHTML = '<div class="no-records">Nenhum registro encontrado.</div>';
            }
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            container.innerHTML = '<div class="error-message">Erro ao carregar registros.</div>';
        }
    }

    displayRecords(data) {
        const container = document.getElementById('recordsContainer');
        const records = Object.entries(data).map(([key, value]) => ({ id: key, ...value }));
        
        // Sort by timestamp (newest first)
        records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        let cardsHTML = '<div class="records-container">';

        records.forEach(record => {
            const tipoDisplay = record.tipoOcorrencia === 'outros' && record.outrosEspecificacao 
                ? `OUTROS: ${record.outrosEspecificacao}` 
                : this.getTipoOcorrenciaLabel(record.tipoOcorrencia);

            const demandaDisplay = this.getDemandaLabel(record.demanda);

            cardsHTML += `
                <div class="record-card">
                    <div class="record-header">
                        <div class="record-date">${(record.dataRegistro || 'N/A').toUpperCase()}</div>
                        <div class="record-id">#${record.id.substring(0, 8).toUpperCase()}</div>
                    </div>
                    <div class="record-fields">
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml((record.equipe || 'N/A').toUpperCase())}', 'EQUIPE')">EQUIPE:</div>
                            <div class="field-value">${(record.equipe || 'N/A').toUpperCase()}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml((record.vtr || 'N/A').toUpperCase())}', 'VTR')">VTR:</div>
                            <div class="field-value">${(record.vtr || 'N/A').toUpperCase()}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml((record.web || 'N/A').toUpperCase())}', 'WEB')">WEB:</div>
                            <div class="field-value">${(record.web || 'N/A').toUpperCase()}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml(demandaDisplay.toUpperCase()) || 'N/A'}', 'DEMANDA')">DEMANDA:</div>
                            <div class="field-value">${demandaDisplay.toUpperCase()}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml(tipoDisplay.toUpperCase())}', 'TIPO DE OCORRÊNCIA')">TIPO DE OCORRÊNCIA:</div>
                            <div class="field-value">${tipoDisplay.toUpperCase()}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${record.horaInicial} - ${record.horaFinal}', 'HORÁRIO')">HORÁRIO:</div>
                            <div class="field-value">${record.horaInicial} - ${record.horaFinal}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml((record.endereco || 'N/A').toUpperCase())}', 'ENDEREÇO')">ENDEREÇO:</div>
                            <div class="field-value">${(record.endereco || 'N/A').toUpperCase()}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml(record.coordenadas || 'N/A')}', 'COORDENADAS')">COORDENADAS:</div>
                            <div class="field-value">${record.coordenadas || 'N/A'}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml((record.municipio || 'N/A').toUpperCase())}', 'MUNICÍPIO')">MUNICÍPIO:</div>
                            <div class="field-value">${(record.municipio || 'N/A').toUpperCase()}</div>
                        </div>
                        <div class="record-field">
                            <div class="field-label" onclick="copyToClipboard('${this.escapeHtml((record.historico || 'N/A').toUpperCase())}', 'HISTÓRICO')">HISTÓRICO:</div>
                            <div class="field-value">${(record.historico || 'N/A').toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        cardsHTML += '</div>';
        container.innerHTML = cardsHTML;
    }

    getDemandaLabel(demanda) {
        const labels = {
            '1': '1ª',
            '2': '2ª',
            '3': '3ª',
            '4': '4ª',
            '5': '5ª',
            '6': '6ª',
            'almoco': 'ALMOÇO',
            'janta': 'JANTA'
        };
        return labels[demanda] || demanda;
    }

    escapeHtml(text) {
        if (!text || text === 'N/A') return text;
        return text.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }

    getTipoOcorrenciaLabel(tipo) {
        const labels = {
            'flora': 'FLORA',
            'fauna': 'FAUNA',
            'fauna_ictiologica': 'FAUNA ICTIOLÓGICA',
            'outros': 'OUTROS'
        };
        return labels[tipo] || tipo;
    }

    truncateText(text, maxLength) {
        if (!text) return 'N/A';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    addInputValidation() {
        const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearMessages();
                this.updateSubmitButton();
                
                // Convert text inputs to uppercase (except for coordinates field)
                if ((input.type === 'text' || input.tagName === 'TEXTAREA') && input.id !== 'coord') {
                    const cursorPosition = input.selectionStart;
                    input.value = input.value.toUpperCase();
                    input.setSelectionRange(cursorPosition, cursorPosition);
                }
            });
            
            input.addEventListener('change', () => {
                this.clearMessages();
                this.updateSubmitButton();
                
                // Mostrar/ocultar campo "Outros" para select
                if (input.id === 'tipoOcorrencia') {
                    this.toggleOutrosField(input.value === 'outros');
                }
            });
        });

        // Add validation for the "outros" text field
        const outrosInput = document.getElementById('outrosText');
        outrosInput.addEventListener('input', () => {
            this.clearMessages();
            this.updateSubmitButton();
            
            // Convert to uppercase
            const cursorPosition = outrosInput.selectionStart;
            outrosInput.value = outrosInput.value.toUpperCase();
            outrosInput.setSelectionRange(cursorPosition, cursorPosition);
        });
    }

    toggleOutrosField(show) {
        const outrosGroup = document.getElementById('outrosTextGroup');
        const outrosInput = document.getElementById('outrosText');
        
        if (show) {
            outrosGroup.style.display = 'block';
            outrosInput.required = true;
            outrosInput.focus(); // Add focus to the input when shown
        } else {
            outrosGroup.style.display = 'none';
            outrosInput.required = false;
            outrosInput.value = '';
        }
        
        // Update form validation after toggling
        this.updateSubmitButton();
    }

    validateForm() {
        const formData = new FormData(this.form);
        const errors = [];

        // Validar campos obrigatórios (removido 'web' da lista)
        const requiredFields = ['equipe', 'vtr', 'demanda', 'tipoOcorrencia', 'horaInicial', 'horaFinal', 'endereco', 'coord', 'municipio', 'historico'];
        
        requiredFields.forEach(field => {
            if (!formData.get(field) || formData.get(field).trim() === '') {
                errors.push(`Campo ${this.getFieldLabel(field)} é obrigatório`);
            }
        });

        // Validar campo "Outros" se selecionado
        const tipoOcorrencia = formData.get('tipoOcorrencia');
        const outrosText = formData.get('outrosText');
        if (tipoOcorrencia === 'outros') {
            if (!outrosText || outrosText.trim().length < 10) {
                errors.push('Campo "Especifique outros" deve ter pelo menos 10 caracteres');
            }
        }

        // Validar horários
        const horaInicial = formData.get('horaInicial');
        const horaFinal = formData.get('horaFinal');
        if (horaInicial && horaFinal && horaInicial >= horaFinal) {
            errors.push('Hora final deve ser posterior à hora inicial');
        }

        return errors;
    }

    getFieldLabel(field) {
        const labels = {
            'equipe': 'EQUIPE',
            'vtr': 'VTR',
            'web': 'WEB',
            'demanda': 'DEMANDA',
            'tipoOcorrencia': 'TIPO DE OCORRÊNCIA',
            'horaInicial': 'HORA INICIAL',
            'horaFinal': 'HORA FINAL',
            'endereco': 'ENDEREÇO',
            'coord': 'COORDENADAS',
            'municipio': 'MUNICÍPIO',
            'historico': 'HISTÓRICO'
        };
        return labels[field] || field;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const errors = this.validateForm();
        if (errors.length > 0) {
            this.showMessage(errors.join('<br>'), 'error');
            return;
        }

        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Salvando...';

        try {
            const formData = this.getFormData();
            await this.saveToFirebase(formData);
            this.showMessage('Ocorrência salva com sucesso!', 'success');
            this.resetForm();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.showMessage('Erro ao salvar ocorrência. Tente novamente.', 'error');
        } finally {
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Salvar';
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {
            equipe: formData.get('equipe'),
            vtr: formData.get('vtr'),
            web: formData.get('web'),
            demanda: formData.get('demanda'),
            tipoOcorrencia: formData.get('tipoOcorrencia'),
            outrosEspecificacao: formData.get('outrosText'),
            horaInicial: formData.get('horaInicial'),
            horaFinal: formData.get('horaFinal'),
            endereco: formData.get('endereco'),
            coordenadas: formData.get('coord'),
            municipio: formData.get('municipio'),
            historico: formData.get('historico'),
            timestamp: new Date().toISOString(),
            dataRegistro: new Date().toLocaleDateString('pt-BR')
        };
        return data;
    }

    async saveToFirebase(data) {
        try {
            console.log('Attempting to save data:', data);
            const ocorrenciasRef = ref(database, 'ocorrencias');
            const newOcorrenciaRef = push(ocorrenciasRef);
            await set(newOcorrenciaRef, data);
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Firebase save error:', error);
            throw error;
        }
    }

    showMessage(message, type) {
        this.clearMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.innerHTML = message.toUpperCase();
        this.form.appendChild(messageDiv);
        
        // Auto-remover mensagem de sucesso após 5 segundos
        if (type === 'success') {
            setTimeout(() => {
                this.clearMessages();
            }, 5000);
        }
    }

    clearMessages() {
        const messages = this.form.querySelectorAll('.success-message, .error-message');
        messages.forEach(msg => msg.remove());
    }

    updateSubmitButton() {
        // Remove form validation check to always enable the button
        this.submitButton.disabled = false;
    }

    resetForm() {
        this.form.reset();
        // Restaurar valor padrão do VTR
        document.getElementById('vtr').value = 'A-0';
        // Ocultar campo "Outros"
        this.toggleOutrosField(false);
        this.updateSubmitButton();
    }
}

// Inicializar o handler do formulário quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new FormHandler();
});

// Global function for copying to clipboard
window.copyToClipboard = async function(text, fieldName) {
    try {
        await navigator.clipboard.writeText(text);
        showCopyFeedback(`${fieldName} copiado!`);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyFeedback(`${fieldName} copiado!`);
    }
};

function showCopyFeedback(message) {
    // Remove existing feedback
    const existingFeedback = document.querySelector('.copy-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Create new feedback
    const feedback = document.createElement('div');
    feedback.className = 'copy-feedback';
    feedback.textContent = message;
    document.body.appendChild(feedback);

    // Show feedback
    setTimeout(() => feedback.classList.add('show'), 100);

    // Hide and remove feedback
    setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => feedback.remove(), 300);
    }, 2000);
}