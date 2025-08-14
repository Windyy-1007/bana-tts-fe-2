// main.js for navigation and TTS API call

document.addEventListener('DOMContentLoaded', function () {
    // Mobile-friendly enhancements
    function initMobileEnhancements() {
        // Prevent zoom on input focus for iOS
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                if (window.innerWidth <= 480) {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            });
            
            input.addEventListener('blur', function() {
                if (window.innerWidth <= 480) {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', 
                        'width=device-width, initial-scale=1.0, user-scalable=no');
                }
            });
        });

        // Add touch feedback for buttons
        const buttons = document.querySelectorAll('button, .nav-btn, .region-option');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            button.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            }, { passive: true });
            
            button.addEventListener('touchcancel', function() {
                this.style.transform = '';
            }, { passive: true });
        });

        // Prevent double-tap zoom on buttons
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // Initialize mobile enhancements
    initMobileEnhancements();

    // Helper function to determine the correct API base URL
    function getApiBaseUrl() {
        // Always use relative URLs - nginx should handle the routing
        return '';
    }

    // Helper function to make TTS API call with fallback options
    async function callTTSAPI(text, gender, region) {
        const currentLang = document.getElementById('lang-select')?.value || 'vi';
        const t = translations[currentLang];

        try {
            // Try the Flask backend first
            const apiBaseUrl = getApiBaseUrl();
            const response = await fetch(`${apiBaseUrl}/speak`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    text: text, 
                    gender: gender, 
                    region: region 
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.speech) {
                    return { success: true, audioData: result.speech };
                } else {
                    throw new Error(result.error || t.errorGeneratingSpeech);
                }
            } else {
                throw new Error(`Backend returned ${response.status}`);
            }
        } catch (backendError) {
            console.warn('Flask backend failed, trying direct API:', backendError);
            
            // Fallback: Try direct API call (will work on localhost due to CORS relaxation)
            try {
                const directResponse = await fetch('https://www.ura.hcmut.edu.vn/bahnar/nmt/api/translateBahnar/voice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, gender, region })
                });
                
                const apiData = await directResponse.json();
                if (apiData.success && apiData.code === 200) {
                    const payload = JSON.parse(apiData.payload || '{}');
                    const urls = payload.urls || [];
                    if (urls.length === 0) throw new Error(t.errorGeneratingSpeech);
                    
                    const audioUrl = urls[0];
                    
                    // Poll for audio file
                    for (let attempt = 0; attempt < 30; attempt++) {
                        try {
                            const audioResp = await fetch(audioUrl);
                            if (audioResp.status === 200) {
                                const audioBlob = await audioResp.blob();
                                // Convert blob to base64
                                const reader = new FileReader();
                                const base64Data = await new Promise((resolve) => {
                                    reader.onloadend = () => {
                                        const base64 = reader.result.split(',')[1];
                                        resolve(base64);
                                    };
                                    reader.readAsDataURL(audioBlob);
                                });
                                return { success: true, audioData: base64Data };
                            } else if (audioResp.status === 404) {
                                await new Promise(res => setTimeout(res, 1000));
                            } else {
                                throw new Error(`Audio fetch failed: ${audioResp.status}`);
                            }
                        } catch (audioError) {
                            if (attempt === 29) throw audioError;
                            await new Promise(res => setTimeout(res, 1000));
                        }
                    }
                    throw new Error('Audio not available after timeout');
                } else {
                    throw new Error(apiData.error || t.errorGeneratingSpeech);
                }
            } catch (directError) {
                console.error('Direct API also failed:', directError);
                throw new Error(`Both backend and direct API failed. Backend: ${backendError.message}, Direct: ${directError.message}`);
            }
        }
    }

    // Language switching system - moved to top so it's available everywhere
    const translations = {
        vi: {
            appTitle: 'Tổng hợp tiếng nói Ba Na từ văn bản tiếng Ba Na',
            navText: 'Văn bản',
            navImage: 'Hình ảnh',
            navFile: 'Tệp tin',
            navAbout: 'Giới thiệu',
            regionLabel: 'Phương ngữ:',
            placeholderText: 'Nhập văn bản tại đây...',
            voiceMale: 'Nam',
            voiceFemale: 'Nữ',
            speakBtn: 'Phát âm',
            historyBtn: 'Lịch sử',
            resultDefault: 'Nhấp "Phát âm" để tạo âm thanh',
            ocrDropText: 'Kéo thả hình ảnh vào đây',
            ocrDropSubtext: 'hoặc nhấp để chọn',
            ocrResult: 'Chọn hoặc thả hình ảnh để trích xuất văn bản tự động',
            fileDropText: 'Kéo thả tệp văn bản vào đây',
            fileDropSubtext: 'Hỗ trợ tệp .txt, .docx',
            fileResult: 'Chọn hoặc thả tệp văn bản để trích xuất nội dung tự động',
            aboutTitle: 'Giới thiệu',
            developmentTeam: 'Đội ngũ phát triển',
            developmentTeamText: 'Ứng dụng chuyển văn bản thành giọng nói tiếng Bahnar này được phát triển bởi nhóm <strong>URA - Unlimited Research group of AI</strong>, một nhóm nghiên cứu tiên tiến chuyên về công nghệ trí tuệ nhân tạo nhằm bảo tồn ngôn ngữ và nâng cao khả năng tiếp cận.',
            projectLeadership: 'Lãnh đạo dự án',
            projectLeadershipText: 'Dự án được dẫn dắt bởi <strong>PGS. TS. Quản Thành Thơ</strong>, Trưởng khoa Khoa học máy tính và Kỹ thuật máy tính tại Trường Đại học Bách Khoa, Đại học Quốc gia TP.HCM. Dưới sự hướng dẫn của thầy, nhóm URA đã tập trung phát triển các giải pháp AI sáng tạo, kết nối giữa ngôn ngữ truyền thống và công nghệ hiện đại.',
            mission: 'Sứ mệnh',
            missionText: 'Sứ mệnh của chúng tôi là bảo tồn và phát huy tiếng Bahnar thông qua công nghệ chuyển văn bản thành giọng nói tiên tiến. Bằng cách phát triển ứng dụng này, chúng tôi hướng tới:',
            missionItem1: '<strong>Bảo tồn di sản văn hóa:</strong> Giúp duy trì di sản ngôn ngữ phong phú của người Bahnar',
            missionItem2: '<strong>Nâng cao khả năng tiếp cận:</strong> Làm cho nội dung tiếng Bahnar dễ tiếp cận hơn thông qua chuyển đổi âm thanh',
            missionItem3: '<strong>Hỗ trợ giáo dục:</strong> Cung cấp công cụ cho việc học ngôn ngữ và mục đích giáo dục',
            missionItem4: '<strong>Thúc đẩy đổi mới:</strong> Phát triển nghiên cứu AI trong xử lý ngôn ngữ ít tài nguyên',
            technicalExcellence: 'Xuất sắc kỹ thuật',
            technicalExcellenceText: 'Ứng dụng thể hiện sự hội tụ của công nghệ web hiện đại, học máy và chuyên môn ngôn ngữ học, thể hiện cam kết của nhóm trong việc cung cấp các giải pháp chất lượng cao phục vụ cả tiến bộ công nghệ và bảo tồn văn hóa.',
            university: 'Trường Đại học',
            universityText: '<strong>Trường Đại học Bách Khoa</strong><br><strong>Đại học Quốc gia TP.HCM</strong>',
            universityFooter: 'Để biết thêm thông tin về các hoạt động nghiên cứu và dự án của chúng tôi, vui lòng truy cập các kênh chính thức của trường.',
            historyTitle: 'Lịch sử phát âm',
            historyEmpty: 'Chưa có lịch sử phát âm. Tạo âm thanh để xem tại đây!',
            guideTitle: 'Hướng dẫn gõ tiếng Bahnar',
            guideSpecialChars: 'Ký tự đặc biệt:',
            guideVietnameseChars: 'Ký tự tiếng Việt:',
            guideTips: 'Mẹo:',
            guideTip1: '• Viết hoa hay thường đều được cho ký tự thứ 2 (Uu → Ŭ)',
            guideTip2: '• Gõ lặp ký tự giống nhau để hủy (e66 → e6)',
            guideTip3: '• Gõ tự nhiên - thay thế tự động ngay lập tức',
            guideTip4: '• Tắt Unikey trên laptop/PC hoặc chuyển sang bàn phím tiếng Anh trên điện thoại',
            errorEnterText: 'Vui lòng nhập văn bản để chuyển đổi thành giọng nói.',
            generatingSpeech: 'Đang tạo giọng nói...',
            loadingAudio: 'Đang tải âm thanh...',
            playingSpeech: 'Đang phát âm thanh',
            speechCompleted: 'Phát âm hoàn thành',
            errorPlayingAudio: 'Lỗi phát âm thanh.',
            errorGeneratingSpeech: 'Lỗi tạo giọng nói.',
            processingImage: 'Đang xử lý hình ảnh...',
            initializingOCR: 'Đang khởi tạo OCR...',
            errorProcessingImage: 'Lỗi xử lý hình ảnh'
        },
        en: {
            appTitle: 'Bahnar Text-to-Speech',
            navText: 'Text',
            navImage: 'Image',
            navFile: 'File',
            navAbout: 'About',
            regionLabel: 'Region:',
            placeholderText: 'Enter text here...',
            voiceMale: 'Male',
            voiceFemale: 'Female',
            speakBtn: 'Speak',
            historyBtn: 'History',
            resultDefault: 'Click "Speak" to generate audio',
            ocrDropText: 'Drag & Drop image here',
            ocrDropSubtext: 'or click to browse',
            ocrResult: 'Select or drop an image to extract text automatically',
            fileDropText: 'Drag & Drop text file here',
            fileDropSubtext: 'Supports .txt, .docx files',
            fileResult: 'Select or drop a text file to extract content automatically',
            aboutTitle: 'About',
            developmentTeam: 'Development Team',
            developmentTeamText: 'This Bahnar Text-to-Speech application was developed by <strong>URA - Unlimited Research group of AI</strong>, a cutting-edge research group dedicated to advancing artificial intelligence technologies for language preservation and accessibility.',
            projectLeadership: 'Project Leadership',
            projectLeadershipText: 'The project is led by <strong>Assoc. Prof. Dr. Quan Thanh Tho</strong>, Dean of the Faculty of Computer Science and Engineering at Ho Chi Minh City University of Technology (HCMUT), Vietnam National University Ho Chi Minh City (VNU-HCM). Under his guidance, the URA team has focused on developing innovative AI solutions that bridge the gap between traditional languages and modern technology.',
            mission: 'Mission',
            missionText: 'Our mission is to preserve and promote the Bahnar language through advanced text-to-speech technology. By developing this application, we aim to:',
            missionItem1: '<strong>Preserve Cultural Heritage:</strong> Help maintain the rich linguistic heritage of the Bahnar people',
            missionItem2: '<strong>Enhance Accessibility:</strong> Make Bahnar language content more accessible through audio conversion',
            missionItem3: '<strong>Support Education:</strong> Provide tools for language learning and educational purposes',
            missionItem4: '<strong>Foster Innovation:</strong> Advance AI research in under-resourced language processing',
            technicalExcellence: 'Technical Excellence',
            technicalExcellenceText: 'The application represents a convergence of modern web technologies, machine learning, and linguistic expertise, demonstrating the team\'s commitment to delivering high-quality solutions that serve both technological advancement and cultural preservation.',
            university: 'University',
            universityText: '<strong>Ho Chi Minh City University of Technology</strong><br><strong>Vietnam National University Ho Chi Minh City</strong>',
            universityFooter: 'For more information about our research activities and projects, please visit our institution\'s official channels.',
            historyTitle: 'Speech History',
            historyEmpty: 'No speech history yet. Generate some audio to see it here!',
            guideTitle: 'Bahnar Typing Guide',
            guideSpecialChars: 'Special Characters:',
            guideVietnameseChars: 'Vietnamese Characters:',
            guideTips: 'Tips:',
            guideTip1: "• Case doesn't matter for 2nd character (Uu → Ŭ)",
            guideTip2: '• Repeat same character to cancel (e66 → e6)',
            guideTip3: '• Type naturally - replacement happens instantly',
            guideTip4: '• Turn off Unikey on laptop/PC or switch to English keyboard on phone',
            errorEnterText: 'Please enter text to convert to speech.',
            generatingSpeech: 'Generating speech...',
            loadingAudio: 'Loading audio...',
            playingSpeech: 'Playing speech',
            speechCompleted: 'Speech completed',
            errorPlayingAudio: 'Error playing audio file.',
            errorGeneratingSpeech: 'Error generating speech.',
            processingImage: 'Processing image...',
            initializingOCR: 'Initializing OCR...',
            errorProcessingImage: 'Error processing image'
        }
    };

    function updateLanguage(lang) {
        const t = translations[lang];

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Update main elements
        document.getElementById('app-title').textContent = t.appTitle;
        document.getElementById('tts-btn').textContent = t.navText;
        document.getElementById('ocr-btn').textContent = t.navImage;
        document.getElementById('file-btn').textContent = t.navFile;
        document.getElementById('about-btn').textContent = t.navAbout;

        // Update region labels
        document.querySelectorAll('.region-selector-label').forEach(el => {
            el.textContent = t.regionLabel;
        });

        // Update text input placeholder
        document.getElementById('text-input').placeholder = t.placeholderText;

        // Update voice selectors
        document.querySelectorAll('.voice-selector').forEach(select => {
            select.children[0].textContent = t.voiceMale;
            select.children[1].textContent = t.voiceFemale;
        });

        // Update speak buttons
        document.getElementById('speak-btn').innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M19.07 4.93C20.9 6.76 20.9 9.24 19.07 11.07M15.54 8.46C16.47 9.39 16.47 10.61 15.54 11.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            ${t.speakBtn}
        `;

        document.getElementById('ocr-speak-btn').innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M19.07 4.93C20.9 6.76 20.9 9.24 19.07 11.07M15.54 8.46C16.47 9.39 16.47 10.61 15.54 11.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            ${t.speakBtn}
        `;

        document.getElementById('file-speak-btn').innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M19.07 4.93C20.9 6.76 20.9 9.24 19.07 11.07M15.54 8.46C16.47 9.39 16.47 10.61 15.54 11.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            ${t.speakBtn}
        `;

        // Update history buttons
        document.getElementById('history-btn').textContent = t.historyBtn;
        document.getElementById('ocr-history-btn').textContent = t.historyBtn;
        document.getElementById('file-history-btn').textContent = t.historyBtn;

        // Update result defaults
        document.getElementById('tts-result').textContent = t.resultDefault;
        document.getElementById('ocr-result').textContent = t.ocrResult;
        document.getElementById('file-result').textContent = t.fileResult;

        // Update drop zone texts
        document.querySelector('#ocr-drop-zone .drop-zone-text').textContent = t.ocrDropText;
        document.querySelector('#ocr-drop-zone .drop-zone-subtext').textContent = t.ocrDropSubtext;
        document.querySelector('#file-drop-zone .drop-zone-text').textContent = t.fileDropText;
        document.querySelector('#file-drop-zone .drop-zone-subtext').textContent = t.fileDropSubtext;

        // Update about section
        document.querySelector('#about-content .card-title').textContent = t.aboutTitle;

        // Update about section content
        const aboutSections = document.querySelectorAll('#about-content .about-section');
        if (aboutSections.length >= 5) {
            aboutSections[0].querySelector('h3').textContent = t.developmentTeam;
            aboutSections[0].querySelector('p').innerHTML = t.developmentTeamText;

            aboutSections[1].querySelector('h3').textContent = t.projectLeadership;
            aboutSections[1].querySelector('p').innerHTML = t.projectLeadershipText;

            aboutSections[2].querySelector('h3').textContent = t.mission;
            aboutSections[2].querySelector('p').innerHTML = t.missionText;

            const missionList = aboutSections[2].querySelector('.mission-list');
            if (missionList) {
                missionList.innerHTML = `
                    <li>${t.missionItem1}</li>
                    <li>${t.missionItem2}</li>
                    <li>${t.missionItem3}</li>
                    <li>${t.missionItem4}</li>
                `;
            }

            aboutSections[3].querySelector('h3').textContent = t.technicalExcellence;
            aboutSections[3].querySelector('p').innerHTML = t.technicalExcellenceText;

            aboutSections[4].querySelector('h3').textContent = t.university;
            const universityPs = aboutSections[4].querySelectorAll('p');
            if (universityPs.length >= 2) {
                universityPs[0].innerHTML = t.universityText;
                universityPs[1].innerHTML = t.universityFooter;
            }
        }

        // Update history panel
        document.querySelector('.history-panel-title').innerHTML = `
            ${t.historyTitle}
            <button class="close-history-btn" id="close-history-btn">×</button>
        `;
        document.getElementById('empty-history').textContent = t.historyEmpty;

        // Update typing guide
        document.querySelector('.guide-header h3').textContent = t.guideTitle;
        document.querySelector('.guide-content h4').textContent = t.guideSpecialChars;
        document.querySelectorAll('.guide-content h4')[1].textContent = t.guideVietnameseChars;
        document.querySelectorAll('.guide-content h4')[2].textContent = t.guideTips;

        const tipsList = document.querySelector('.tips-list');
        tipsList.innerHTML = `
            <li>${t.guideTip1}</li>
            <li>${t.guideTip2}</li>
            <li>${t.guideTip3}</li>
            <li>${t.guideTip4}</li>
        `;

        // Re-attach close history button event listener
        const newCloseBtn = document.getElementById('close-history-btn');
        if (newCloseBtn) newCloseBtn.addEventListener('click', closeHistory);
    }

    function closeHistory() {
        const historyPanel = document.getElementById('history-panel');
        const container = document.querySelector('.container');
        historyPanel.classList.remove('open');
        container.classList.remove('history-open');
    }

    // Language selector with Vietnamese as default
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        // Set default to Vietnamese
        langSelect.value = 'vi';
        updateLanguage('vi');

        langSelect.addEventListener('change', function () {
            updateLanguage(this.value);
        });
    }

    // History management
    let speechHistory = JSON.parse(localStorage.getItem('speechHistory') || '[]');
    const audioCache = new Map(); // Cache for audio blobs

    function saveToHistory(text, region, voice, audioData) {
        const timestamp = new Date().toISOString();
        const historyItem = {
            id: Date.now(),
            text,
            region,
            voice,
            timestamp,
            audioData
        };

        speechHistory.unshift(historyItem);
        // Keep only the latest 50 items
        if (speechHistory.length > 50) {
            speechHistory = speechHistory.slice(0, 50);
        }

        try {
            localStorage.setItem('speechHistory', JSON.stringify(speechHistory));
            audioCache.set(historyItem.id, audioData);
            console.log(`Saved audio to history: ID ${historyItem.id}, data length: ${audioData ? audioData.length : 'null'}`);
            updateHistoryDisplay();
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            // If localStorage fails, still keep in memory
            audioCache.set(historyItem.id, audioData);
            updateHistoryDisplay();
        }
    }

    function updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        const emptyHistory = document.getElementById('empty-history');
        const langSelect = document.getElementById('lang-select');
        const currentLang = langSelect ? langSelect.value : 'vi';
        const t = translations[currentLang];

        if (speechHistory.length === 0) {
            emptyHistory.style.display = 'block';
            emptyHistory.textContent = t.historyEmpty;
            return;
        }

        emptyHistory.style.display = 'none';
        historyList.innerHTML = `<div class="empty-history" id="empty-history" style="display: none;">${t.historyEmpty}</div>`;

        speechHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            historyItem.innerHTML = `
                <div class="history-item-text">${item.text}</div>
                <div class="history-item-meta">
                    <span>${item.region.charAt(0).toUpperCase() + item.region.slice(1)} | ${item.voice}</span>
                    <span>${new Date(item.timestamp).toLocaleDateString()} ${new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="history-item-actions">
                    <button class="history-action-btn replay-btn" data-id="${item.id}" title="Replay">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                      </svg>
                    </button>
                    <button class="history-action-btn secondary download-btn" data-id="${item.id}" data-filename="${item.text.substring(0, 20)}" title="Download">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 15V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                </div>
            `;

            // Add event listeners for the buttons
            const replayBtn = historyItem.querySelector('.replay-btn');
            const downloadBtn = historyItem.querySelector('.download-btn');

            if (replayBtn) {
                replayBtn.addEventListener('click', () => {
                    replayAudio(item.id);
                });
            }

            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    const filename = item.text.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
                    downloadAudio(item.id, filename);
                });
            }

            historyList.appendChild(historyItem);
        });
    }

    // Global functions for history actions
    window.replayAudio = function (id) {
        const item = speechHistory.find(h => h.id === id);
        if (item && (audioCache.has(id) || item.audioData)) {
            try {
                const audioData = audioCache.get(id) || item.audioData;

                // Convert base64 to binary to detect format
                const binaryString = atob(audioData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Try to detect audio format from the data
                let mimeType = 'audio/wav'; // default

                // Check for common audio file signatures
                if (bytes.length > 4) {
                    // MP3 signature
                    if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) {
                        mimeType = 'audio/mpeg';
                    }
                    // OGG signature
                    else if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
                        mimeType = 'audio/ogg';
                    }
                    // WAV signature (RIFF...WAVE)
                    else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                        bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
                        mimeType = 'audio/wav';
                    }
                    // M4A/MP4 signature
                    else if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
                        mimeType = 'audio/mp4';
                    }
                }

                console.log('Detected audio format for replay:', mimeType);

                // Create audio with proper MIME type
                const audio = new Audio();
                audio.src = `data:${mimeType};base64,${audioData}`;

                audio.oncanplaythrough = function () {
                    console.log('Audio ready to play');
                };

                audio.onerror = function (e) {
                    console.error('Audio playback error:', e);
                    // Fallback to WAV format
                    audio.src = 'data:audio/wav;base64,' + audioData;
                    audio.load();

                    // If WAV also fails, try with blob URL
                    audio.onerror = function (e2) {
                        console.error('WAV fallback also failed:', e2);
                        try {
                            const blob = new Blob([bytes], { type: mimeType });
                            const url = URL.createObjectURL(blob);
                            audio.src = url;
                            audio.load();

                            audio.onended = function () {
                                URL.revokeObjectURL(url);
                            };
                        } catch (blobError) {
                            console.error('Blob fallback failed:', blobError);
                            alert('Unable to play audio. The file might be corrupted or in an unsupported format.');
                        }
                    };
                };

                audio.play().catch(err => {
                    console.error('Error playing audio:', err);
                    alert('Unable to play audio. The file might be corrupted or in an unsupported format.');
                });
            } catch (error) {
                console.error('Replay error:', error);
                alert('Failed to replay audio. Please try downloading the file instead.');
            }
        } else {
            console.error('Audio data not found for id:', id);
            alert('Audio data not available for playback.');
        }
    };

    window.downloadAudio = function (id, filename) {
        console.log(`Download requested for ID: ${id}, filename: ${filename}`);

        const item = speechHistory.find(h => h.id === id);
        console.log('Found history item:', item ? 'Yes' : 'No');

        if (item) {
            const hasAudioData = !!(audioCache.has(id) || item.audioData);
            console.log('Has audio data:', hasAudioData);
            console.log('Audio cache has ID:', audioCache.has(id));
            console.log('Item has audioData:', !!item.audioData);
        }

        if (item && (audioCache.has(id) || item.audioData)) {
            try {
                const audioData = audioCache.get(id) || item.audioData;
                console.log('Audio data length:', audioData ? audioData.length : 'null');

                if (!audioData) {
                    throw new Error('Audio data is empty or null');
                }

                // Convert base64 to binary
                const binaryString = atob(audioData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                console.log('Binary data length:', bytes.length);

                // Try to detect audio format from the data
                let mimeType = 'audio/wav';
                let extension = '.wav';

                // Check for common audio file signatures
                if (bytes.length > 4) {
                    // MP3 signature
                    if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) {
                        mimeType = 'audio/mpeg';
                        extension = '.mp3';
                    }
                    // OGG signature
                    else if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
                        mimeType = 'audio/ogg';
                        extension = '.ogg';
                    }
                    // WAV signature (RIFF...WAVE)
                    else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                        bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
                        mimeType = 'audio/wav';
                        extension = '.wav';
                    }
                    // M4A/MP4 signature
                    else if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
                        mimeType = 'audio/mp4';
                        extension = '.m4a';
                    }
                }

                console.log(`Detected audio format: ${mimeType}, extension: ${extension}`);

                const blob = new Blob([bytes], { type: mimeType });
                console.log('Blob created, size:', blob.size);

                const url = URL.createObjectURL(blob);
                console.log('Object URL created:', url);

                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename.replace(/[^a-zA-Z0-9]/g, '_')}_speech${extension}`;
                a.style.display = 'none';
                document.body.appendChild(a);

                console.log('Triggering download...');
                a.click();

                document.body.removeChild(a);

                // Clean up after a delay to ensure download starts
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    console.log('Object URL revoked');
                }, 1000);

                console.log('Download initiated successfully');
            } catch (error) {
                console.error('Download failed:', error);
                alert('Failed to download audio file: ' + error.message);
            }
        } else {
            console.error('Audio data not found for id:', id);
            console.log('Available history items:', speechHistory.map(h => ({ id: h.id, hasData: !!h.audioData })));
            console.log('Audio cache keys:', Array.from(audioCache.keys()));
            alert('Audio data not available for download.');
        }
    };

    // History panel controls
    const historyBtn = document.getElementById('history-btn');
    const historyPanel = document.getElementById('history-panel');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const container = document.querySelector('.container');

    function openHistory() {
        historyPanel.classList.add('open');
        container.classList.add('history-open');
        updateHistoryDisplay();
    }

    function closeHistory() {
        historyPanel.classList.remove('open');
        container.classList.remove('history-open');
    }

    if (historyBtn) historyBtn.addEventListener('click', openHistory);
    if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', closeHistory);

    // Add event listeners for OCR and File history buttons
    const ocrHistoryBtn = document.getElementById('ocr-history-btn');
    const fileHistoryBtn = document.getElementById('file-history-btn');

    if (ocrHistoryBtn) ocrHistoryBtn.addEventListener('click', openHistory);
    if (fileHistoryBtn) fileHistoryBtn.addEventListener('click', openHistory);

    // Initialize history display
    updateHistoryDisplay();

    // Navigation logic with error handling
    const navBtnIds = ['tts-btn', 'ocr-btn', 'file-btn', 'about-btn'];
    const contentIds = ['tts-content', 'ocr-content', 'file-content', 'about-content'];
    const navBtns = navBtnIds.map(id => document.getElementById(id));
    const contents = contentIds.map(id => document.getElementById(id));

    function showSection(idx) {
        contents.forEach((content, i) => {
            if (content) content.classList.toggle('hidden', i !== idx);
        });
        navBtns.forEach((btn, i) => {
            if (btn) btn.classList.toggle('active', i === idx);
        });
    }

    navBtns.forEach((btn, idx) => {
        if (btn) btn.addEventListener('click', () => showSection(idx));
    });
    // Default to TTS
    showSection(0);

    // Region selector logic
    const regionOptions = document.querySelectorAll('.region-option');
    let selectedRegion = 'gialai'; // default

    regionOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Remove active class from all options
            regionOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked option
            this.classList.add('active');
            // Update selected region
            selectedRegion = this.getAttribute('data-region');
        });
    });

    // TTS API call
    const speakBtn = document.getElementById('speak-btn');
    const textInput = document.getElementById('text-input');
    const ttsResult = document.getElementById('tts-result');
    const voiceSelect = document.getElementById('voice-select');

    // Bahnar typing auto-replace functionality
    const replacements = {
        // u patterns
        'u8': 'ŭ', 'uu': 'ŭ', 'u\\': 'ŭ',
        'U8': 'Ŭ', 'UU': 'Ŭ', 'Uu': 'Ŭ', 'uU': 'Ŭ', 'U\\': 'Ŭ',

        // c patterns
        'c6': 'ĉ', 'cc': 'ĉ', 'c\\': 'ĉ',
        'C6': 'Ĉ', 'CC': 'Ĉ', 'Cc': 'Ĉ', 'cC': 'Ĉ', 'C\\': 'Ĉ',

        // e patterns
        'e8': 'ĕ', 'ew': 'ĕ', 'e\\': 'ĕ',
        'E8': 'Ĕ', 'EW': 'Ĕ', 'Ew': 'Ĕ', 'eW': 'Ĕ', 'E\\': 'Ĕ',

        // i patterns
        'i8': 'ĭ', 'iw': 'ĭ', 'i\\': 'ĭ',
        'I8': 'Ĭ', 'IW': 'Ĭ', 'Iw': 'Ĭ', 'iW': 'Ĭ', 'I\\': 'Ĭ',

        // n patterns
        'n4': 'ñ', 'nx': 'ñ', 'n\\': 'ñ',
        'N4': 'Ñ', 'NX': 'Ñ', 'Nx': 'Ñ', 'nX': 'Ñ', 'N\\': 'Ñ',

        // o patterns
        'o8': 'ǒ', 'o\\': 'ǒ',
        'O8': 'Ǒ', 'O\\': 'Ǒ',

        // Vietnamese diacritical characters
        // a patterns
        'aw': 'ă', 'a8': 'ă',
        'AW': 'Ă', 'Aw': 'Ă', 'aW': 'Ă', 'A8': 'Ă',
        'aa': 'â', 'a6': 'â',
        'AA': 'Â', 'Aa': 'Â', 'aA': 'Â', 'A6': 'Â',

        // d patterns
        'dd': 'đ', 'd9': 'đ',
        'DD': 'Đ', 'Dd': 'Đ', 'dD': 'Đ', 'D9': 'Đ',

        // e patterns (additional)
        'ee': 'ê', 'e6': 'ê',
        'EE': 'Ê', 'Ee': 'Ê', 'eE': 'Ê', 'E6': 'Ê',

        // o patterns (additional)
        'oo': 'ô', 'o6': 'ô',
        'OO': 'Ô', 'Oo': 'Ô', 'oO': 'Ô', 'O6': 'Ô',
        'ow': 'ơ', 'o7': 'ơ',
        'OW': 'Ơ', 'Ow': 'Ơ', 'oW': 'Ơ', 'O7': 'Ơ',

        // u patterns (additional)
        'uw': 'ư', 'u7': 'ư',
        'UW': 'Ư', 'Uw': 'Ư', 'uW': 'Ư', 'U7': 'Ư'
    };

    // Cancellation patterns (same second character repeated)
    const cancellationPatterns = {
        'e66': 'e6', 'E66': 'E6',
        'u88': 'u8', 'U88': 'U8',
        'c66': 'c6', 'C66': 'C6',
        'i88': 'i8', 'I88': 'I8',
        'n44': 'n4', 'N44': 'N4',
        'o88': 'o8', 'O88': 'O8',
        'uuu': 'uu', 'UUU': 'UU', 'Uuu': 'Uu',
        'ccc': 'cc', 'CCC': 'CC', 'Ccc': 'Cc',
        'eww': 'ew', 'EWW': 'EW', 'Eww': 'Ew',
        'iww': 'iw', 'IWW': 'IW', 'Iww': 'Iw',
        'nxx': 'nx', 'NXX': 'NX', 'Nxx': 'Nx',
        'n\\\\': 'n\\', 'N\\\\': 'N\\',
        'e\\\\': 'e\\', 'E\\\\': 'E\\',
        'u\\\\': 'u\\', 'U\\\\': 'U\\',
        'c\\\\': 'c\\', 'C\\\\': 'C\\',
        'i\\\\': 'i\\', 'I\\\\': 'I\\',
        'o\\\\': 'o\\', 'O\\\\': 'O\\',

        // Vietnamese character cancellations
        'a88': 'a8', 'A88': 'A8',
        'a66': 'a6', 'A66': 'A6',
        'aww': 'aw', 'AWW': 'AW', 'Aww': 'Aw',
        'aaa': 'aa', 'AAA': 'AA', 'Aaa': 'Aa',
        'd99': 'd9', 'D99': 'D9',
        'ddd': 'dd', 'DDD': 'DD', 'Ddd': 'Dd',
        'eee': 'ee', 'EEE': 'EE', 'Eee': 'Ee',
        'ooo': 'oo', 'OOO': 'OO', 'Ooo': 'Oo',
        'o66': 'o6', 'O66': 'O6',
        'o77': 'o7', 'O77': 'O7',
        'oww': 'ow', 'OWW': 'OW', 'Oww': 'Ow',
        'u77': 'u7', 'U77': 'U7',
        'uww': 'uw', 'UWW': 'UW', 'Uww': 'Uw'
    };

    function handleAutoReplace(event) {
        const textarea = event.target;
        const cursorPos = textarea.selectionStart;
        const text = textarea.value;

        // Check for cancellation patterns first (3 characters)
        if (cursorPos >= 3) {
            const last3 = text.substring(cursorPos - 3, cursorPos);
            if (cancellationPatterns[last3]) {
                const newText = text.substring(0, cursorPos - 3) + cancellationPatterns[last3] + text.substring(cursorPos);
                textarea.value = newText;
                textarea.setSelectionRange(cursorPos - 1, cursorPos - 1);
                return;
            }
        }

        // Check for replacement patterns (2 characters)
        if (cursorPos >= 2) {
            const last2 = text.substring(cursorPos - 2, cursorPos);
            if (replacements[last2]) {
                const newText = text.substring(0, cursorPos - 2) + replacements[last2] + text.substring(cursorPos);
                textarea.value = newText;
                textarea.setSelectionRange(cursorPos - 1, cursorPos - 1);
                return;
            }
        }
    }

    // Auto-expanding textbox functionality
    if (textInput) {
        function autoResize() {
            // Reset height to auto to get the correct scrollHeight
            textInput.style.height = 'auto';
            // Set the height to either scrollHeight or min-height, whichever is larger
            const newHeight = Math.max(textInput.scrollHeight, 120);
            const maxHeight = 400;
            textInput.style.height = Math.min(newHeight, maxHeight) + 'px';
        }

        // Auto-resize on input
        textInput.addEventListener('input', function (event) {
            handleAutoReplace(event);
            autoResize();
        });

        // Auto-resize on paste
        textInput.addEventListener('paste', function () {
            setTimeout(autoResize, 10);
        });

        // Initial resize in case there's default content
        autoResize();
    }

    if (speakBtn && textInput && ttsResult && voiceSelect) {
        const resultSection = document.querySelector('.result-section');

        speakBtn.addEventListener('click', async function () {
            const text = textInput.value.trim();
            const currentLang = langSelect ? langSelect.value : 'vi';
            const t = translations[currentLang];
            if (!text) {
                ttsResult.textContent = t.errorEnterText;
                ttsResult.className = 'error';
                if (resultSection) resultSection.className = 'result-section error';
                return;
            }
            const gender = voiceSelect.value;
            const region = selectedRegion;
            const originalButtonHTML = speakBtn.innerHTML;
            speakBtn.disabled = true;
            speakBtn.innerHTML = '<span class="btn-spinner"></span>';
            ttsResult.innerHTML = `<span class="spinner"></span>   ${t.generatingSpeech}`;
            ttsResult.className = 'processing';
            if (resultSection) resultSection.className = 'result-section processing';
            try {
                // Use the helper function that handles both backend and direct API calls
                const result = await callTTSAPI(text, gender, region);
                
                if (result.success && result.audioData) {
                    ttsResult.innerHTML = `<span class="spinner"></span> ${t.loadingAudio}`;
                    
                    const audio = new Audio('data:audio/wav;base64,' + result.audioData);
                    
                    audio.onloadstart = function () {
                        ttsResult.innerHTML = `<span class="spinner"></span> ${t.loadingAudio}`;
                        ttsResult.className = 'processing';
                        if (resultSection) resultSection.className = 'result-section processing';
                    };
                    
                    audio.oncanplay = function () {
                        ttsResult.textContent = `${t.playingSpeech} (${region.charAt(0).toUpperCase() + region.slice(1)}, ${gender === 'male' ? t.voiceMale : t.voiceFemale})`;
                        ttsResult.className = 'success';
                        if (resultSection) resultSection.className = 'result-section success';
                    };
                    
                    audio.onended = function () {
                        ttsResult.textContent = `${t.speechCompleted} (${region.charAt(0).toUpperCase() + region.slice(1)}, ${gender === 'male' ? t.voiceMale : t.voiceFemale})`;
                        ttsResult.className = 'success';
                        if (resultSection) resultSection.className = 'result-section success';
                    };
                    
                    audio.onerror = function () {
                        ttsResult.textContent = t.errorPlayingAudio;
                        ttsResult.className = 'error';
                        if (resultSection) resultSection.className = 'result-section error';
                    };
                    
                    await audio.play();
                    saveToHistory(text, region, gender, result.audioData);
                } else {
                    throw new Error(t.errorGeneratingSpeech);
                }
            } catch (err) {
                console.error('TTS Error:', err);
                ttsResult.textContent = `${t.errorGeneratingSpeech}: ${err.message}`;
                ttsResult.className = 'error';
                if (resultSection) resultSection.className = 'result-section error';
            } finally {
                speakBtn.disabled = false;
                speakBtn.innerHTML = originalButtonHTML;
            }
        });
    }

    // Typing guide toggle functionality
    const guideToggle = document.getElementById('guide-toggle');
    const guideContent = document.getElementById('guide-content');

    if (guideToggle && guideContent) {
        // Initially show the guide content
        guideContent.classList.remove('hidden');

        guideToggle.addEventListener('click', function () {
            const isHidden = guideContent.classList.contains('hidden');
            const toggleIcon = guideToggle.querySelector('.toggle-icon');

            if (isHidden) {
                guideContent.classList.remove('hidden');
                toggleIcon.style.transform = 'rotate(0deg)';
            } else {
                guideContent.classList.add('hidden');
                toggleIcon.style.transform = 'rotate(-90deg)';
            }
        });
    }

    // Initialize OCR and Text Parser
    const ocrProcessor = new OCRProcessor();
    const textParser = new TextParser();

    // Test OCR availability on page load
    setTimeout(() => {
        if (typeof Tesseract === 'undefined') {
            console.error('Tesseract.js failed to load from CDN');
            const ocrResult = document.getElementById('ocr-result');
            if (ocrResult) {
                ocrResult.innerHTML = `
                    <div style="color: #ef4444;">❌ OCR library failed to load</div>
                    <div style="font-size: 0.9em; margin-top: 8px; color: #666;">
                        Please check your internet connection and refresh the page.<br>
                        The OCR functionality requires downloading external libraries.
                    </div>
                `;
                ocrResult.className = 'error';
            }
        } else {
            console.log('✅ Tesseract.js loaded successfully');
        }
    }, 1000);

    // OCR functionality
    setupOCRHandlers();
    setupFileHandlers();

    function setupOCRHandlers() {
        const ocrDropZone = document.getElementById('ocr-drop-zone');
        const ocrFileInput = document.getElementById('ocr-file-input');
        const ocrSpeakBtn = document.getElementById('ocr-speak-btn');
        const ocrResult = document.getElementById('ocr-result');
        const ocrVoiceSelect = document.getElementById('ocr-voice-select');

        if (!ocrDropZone || !ocrFileInput) return;

        let selectedFile = null;
        let extractedText = '';

        // Auto-process function
        async function processSelectedFile(file) {
            if (!file || !file.type.startsWith('image/')) return;

            selectedFile = file;
            updateDropZoneWithFile(ocrDropZone, file);

            try {
                const status = ocrProcessor.getProcessingStatus();

                if (status.isInitializing) {
                    ocrResult.innerHTML = '<span class="spinner"></span> Initializing OCR engine (downloading models, first time may take up to 2 minutes)...';
                } else if (!status.isReady) {
                    ocrResult.innerHTML = '<span class="spinner"></span> Starting OCR engine...';
                } else {
                    ocrResult.innerHTML = '<span class="spinner"></span> Processing image...';
                }
                ocrResult.className = 'processing';

                // Add a progress indicator
                let progressDots = 0;
                const progressInterval = setInterval(() => {
                    progressDots = (progressDots + 1) % 4;
                    const dots = '.'.repeat(progressDots);
                    const currentText = ocrResult.textContent;
                    if (currentText.includes('Processing') || currentText.includes('Initializing')) {
                        ocrResult.textContent = currentText.replace(/\.+$/, '') + dots;
                    }
                }, 500);

                try {
                    extractedText = await ocrProcessor.processImage(selectedFile);
                    clearInterval(progressInterval);

                    if (extractedText.trim()) {
                        ocrResult.textContent = extractedText;
                        ocrResult.className = 'success';
                        if (ocrSpeakBtn) ocrSpeakBtn.disabled = false;
                    } else {
                        ocrResult.textContent = 'No text found in the image. Please try a different image with clearer text, or ensure the image contains readable text.';
                        ocrResult.className = 'error';
                    }
                } catch (error) {
                    clearInterval(progressInterval);
                    throw error; // Re-throw to be handled by outer catch
                }

            } catch (error) {
                console.error('OCR Error:', error);
                let errorMessage = 'Error processing image';

                if (error.message.includes('timeout')) {
                    errorMessage = 'OCR processing timed out. This may be due to slow internet connection while downloading OCR models. Please refresh the page and try again.';
                } else if (error.message.includes('initialization')) {
                    errorMessage = 'Failed to initialize OCR engine. Please refresh the page and check your internet connection.';
                } else if (error.message.includes('library not loaded')) {
                    errorMessage = 'OCR library failed to load. Please refresh the page and check your internet connection.';
                } else if (error.message.includes('downloading') || error.message.includes('loading')) {
                    errorMessage = 'Failed to download OCR models. Please check your internet connection and try again.';
                } else {
                    errorMessage += ': ' + error.message;
                }

                ocrResult.innerHTML = `<div style="color: #ef4444;">${errorMessage}</div><div style="font-size: 0.9em; margin-top: 8px; color: #666;">💡 Try refreshing the page and testing with a clear, high-contrast image.</div>`;
                ocrResult.className = 'error';
            }
        }        // Handle file selection through drop zone click
        ocrDropZone.addEventListener('click', () => {
            ocrFileInput.click();
        });

        // Handle file input change - auto process
        ocrFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                processSelectedFile(file);
            }
        });

        // Handle drag and drop - auto process
        ocrDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            ocrDropZone.classList.add('drag-over');
        });

        ocrDropZone.addEventListener('dragleave', () => {
            ocrDropZone.classList.remove('drag-over');
        });

        ocrDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            ocrDropZone.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                processSelectedFile(files[0]);
            }
        });        // Handle speak button for OCR
        ocrSpeakBtn.addEventListener('click', async () => {
            const currentLang = langSelect ? langSelect.value : 'vi';
            const t = translations[currentLang];

            if (!extractedText.trim()) {
                alert(currentLang === 'vi' ? 'Không có văn bản để chuyển đổi thành giọng nói. Vui lòng tải lên và xử lý hình ảnh trước.' : 'No text available to convert to speech. Please upload and process an image first.');
                return;
            }

            const activeRegion = document.querySelector('#ocr-content .region-option.active')?.dataset.region || 'gialai';
            const voice = ocrVoiceSelect.value;

            try {
                ocrSpeakBtn.disabled = true;
                const originalContent = ocrSpeakBtn.innerHTML;
                ocrSpeakBtn.innerHTML = `<div class="btn-spinner"></div> ${currentLang === 'vi' ? 'Đang phát âm...' : 'Speaking...'}`;

                const response = await fetch('/speak', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: extractedText,
                        region: activeRegion,
                        gender: voice
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.speech) {
                        const audio = new Audio('data:audio/wav;base64,' + result.speech);
                        await audio.play();
                        saveToHistory(extractedText, activeRegion, voice, result.speech);
                        ocrResult.className = 'success';
                    } else {
                        throw new Error(result.error || (currentLang === 'vi' ? 'Không nhận được dữ liệu âm thanh' : 'No speech data received'));
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || (currentLang === 'vi' ? 'Yêu cầu TTS thất bại' : 'TTS request failed'));
                }
            } catch (error) {
                console.error('TTS Error:', error);
                alert((currentLang === 'vi' ? 'Lỗi tạo giọng nói: ' : 'Error generating speech: ') + error.message);
            } finally {
                ocrSpeakBtn.disabled = false;
                ocrSpeakBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19.07 4.93C20.9 6.76 20.9 9.24 19.07 11.07M15.54 8.46C16.47 9.39 16.47 10.61 15.54 11.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${t.speakBtn}
                `;
            }
        });
    }

    function setupFileHandlers() {
        const fileDropZone = document.getElementById('file-drop-zone');
        const fileFileInput = document.getElementById('file-file-input');
        const fileSpeakBtn = document.getElementById('file-speak-btn');
        const fileResult = document.getElementById('file-result');
        const fileVoiceSelect = document.getElementById('file-voice-select');

        if (!fileDropZone || !fileFileInput) return;

        let selectedFile = null;
        let extractedText = '';

        // Auto-process function
        async function processSelectedFile(file) {
            if (!file || !textParser.isValidFileType(file)) {
                if (file) {
                    alert(`Unsupported file type. Please select: ${textParser.getValidExtensions()}`);
                }
                return;
            }

            selectedFile = file;
            updateDropZoneWithFile(fileDropZone, file);

            try {
                fileResult.textContent = 'Processing file...';
                fileResult.className = 'processing';

                extractedText = await textParser.parseFile(selectedFile);

                if (extractedText.trim()) {
                    fileResult.textContent = extractedText;
                    fileResult.className = 'success';
                    if (fileSpeakBtn) fileSpeakBtn.disabled = false;
                } else {
                    fileResult.textContent = 'No text found in the file. Please try a different file.';
                    fileResult.className = 'error';
                }
            } catch (error) {
                console.error('File parsing error:', error);
                fileResult.textContent = 'Error processing file: ' + error.message;
                fileResult.className = 'error';
            }
        }

        // Handle file selection through drop zone click
        fileDropZone.addEventListener('click', () => {
            fileFileInput.click();
        });

        // Handle file input change - auto process
        fileFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                processSelectedFile(file);
            }
        });

        // Handle drag and drop - auto process
        fileDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('drag-over');
        });

        fileDropZone.addEventListener('dragleave', () => {
            fileDropZone.classList.remove('drag-over');
        });

        fileDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processSelectedFile(files[0]);
            }
        });

        // Handle speak button for file content
        fileSpeakBtn.addEventListener('click', async () => {
            const currentLang = langSelect ? langSelect.value : 'vi';
            const t = translations[currentLang];

            if (!extractedText.trim()) {
                alert(currentLang === 'vi' ? 'Không có văn bản để chuyển đổi thành giọng nói. Vui lòng tải lên và xử lý tệp trước.' : 'No text available to convert to speech. Please upload and process a file first.');
                return;
            }

            const activeRegion = document.querySelector('#file-content .region-option.active')?.dataset.region || 'gialai';
            const voice = fileVoiceSelect.value;

            try {
                fileSpeakBtn.disabled = true;
                const originalContent = fileSpeakBtn.innerHTML;
                fileSpeakBtn.innerHTML = `<div class="btn-spinner"></div> ${currentLang === 'vi' ? 'Đang phát âm...' : 'Speaking...'}`;

                const response = await fetch('/speak', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: extractedText,
                        region: activeRegion,
                        gender: voice
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.speech) {
                        const audio = new Audio('data:audio/wav;base64,' + result.speech);
                        await audio.play();
                        saveToHistory(extractedText, activeRegion, voice, result.speech);
                        fileResult.className = 'success';
                    } else {
                        throw new Error(result.error || (currentLang === 'vi' ? 'Không nhận được dữ liệu âm thanh' : 'No speech data received'));
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || (currentLang === 'vi' ? 'Yêu cầu TTS thất bại' : 'TTS request failed'));
                }
            } catch (error) {
                console.error('TTS Error:', error);
                alert((currentLang === 'vi' ? 'Lỗi tạo giọng nói: ' : 'Error generating speech: ') + error.message);
            } finally {
                fileSpeakBtn.disabled = false;
                fileSpeakBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19.07 4.93C20.9 6.76 20.9 9.24 19.07 11.07M15.54 8.46C16.47 9.39 16.47 10.61 15.54 11.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${t.speakBtn}
                `;
            }
        });
    }

    function updateDropZoneWithFile(dropZone, file) {
        const content = dropZone.querySelector('.drop-zone-content');
        if (content) {
            content.innerHTML = `
                <svg class="upload-icon success" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p class="drop-zone-text success">File selected: ${file.name}</p>
                <p class="drop-zone-subtext">Click to change file</p>
            `;
        }
    }

    // Handle region selectors for OCR and File content
    document.querySelectorAll('#ocr-content .region-option, #file-content .region-option').forEach(option => {
        option.addEventListener('click', function () {
            // Remove active class from siblings
            this.parentNode.querySelectorAll('.region-option').forEach(sibling => {
                sibling.classList.remove('active');
            });
            // Add active class to clicked option
            this.classList.add('active');
        });
    });
});
