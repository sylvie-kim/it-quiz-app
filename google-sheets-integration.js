// Google Sheets 연동 설정
const GOOGLE_SHEETS_CONFIG = {
    // Google Sheets API 키 (Google Cloud Console에서 생성)
    // 보안상 실제 배포 시에는 별도의 제한된 API 키 사용 권장
    API_KEY: 'AIzaSyD6wm_gJINDtm5vKEoOWkkg4Urt6rwt71c',
    
    // Google Sheets ID (스프레드시트 URL에서 추출)
    SHEET_ID: '1HuJsgCkQwuWiL7c9cW6KVCrH_ntYzcWOWK84zWqUQds',
    
    // 데이터가 있는 시트 이름
    SHEET_NAME: 'IT',
    
    // 데이터 범위 (A:B는 A열부터 B열까지)
    RANGE: 'A:B'
};

/**
 * Google Sheets 설정이 완료되었는지 확인
 */
function isGoogleSheetsConfigured() {
    return GOOGLE_SHEETS_CONFIG.API_KEY !== 'YOUR_GOOGLE_SHEETS_API_KEY' && 
           GOOGLE_SHEETS_CONFIG.SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID' &&
           GOOGLE_SHEETS_CONFIG.API_KEY.length > 10 &&
           GOOGLE_SHEETS_CONFIG.SHEET_ID.length > 10;
}

/**
 * Google Sheets에서 데이터를 가져오는 함수
 */
async function fetchDataFromGoogleSheets() {
    // 설정이 완료되지 않은 경우 에러 방지
    if (!isGoogleSheetsConfigured()) {
        throw new Error('Google Sheets 연동이 설정되지 않았습니다. 먼저 API_KEY와 SHEET_ID를 설정해주세요.');
    }
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SHEET_ID}/values/${GOOGLE_SHEETS_CONFIG.SHEET_NAME}!${GOOGLE_SHEETS_CONFIG.RANGE}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`;
    
    try {
        console.log('Google Sheets에서 데이터를 가져오는 중...');
        console.log('요청 URL:', url); // 디버깅용
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length === 0) {
            throw new Error('Google Sheets에 데이터가 없습니다.');
        }
        
        // 첫 번째 행은 헤더이므로 제외
        const rows = data.values.slice(1);
        
        // 데이터를 termsData 형식으로 변환 (A열: 용어, B열: 정의만 사용)
        console.log('🔍 원본 rows 데이터:', rows);
        
        const updatedTermsData = rows.map((row, index) => {
            const term = row[0] || '';
            const definition = row[1] || '';
            console.log(`Row ${index + 1}: 용어="${term}", 정의="${definition}"`);
            return {
                term: term,
                definition: definition
            };
        }).filter(item => {
            const isValid = item.term && item.definition;
            if (!isValid) {
                console.log('❌ 필터링됨:', item);
            }
            return isValid;
        });
        
        console.log(`${updatedTermsData.length}개의 용어를 성공적으로 가져왔습니다.`);
        console.log('가져온 데이터 샘플:', updatedTermsData.slice(0, 5)); // 처음 5개 용어 출력
        console.log('전체 응답 데이터:', data); // 전체 응답 확인
        return updatedTermsData;
        
    } catch (error) {
        console.error('Google Sheets 데이터 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 로컬 데이터를 Google Sheets 데이터로 업데이트
 */
async function updateTermsFromGoogleSheets() {
    console.log('🚀 updateTermsFromGoogleSheets 함수가 호출되었습니다!');
    try {
        const newTermsData = await fetchDataFromGoogleSheets();
        
        // 전역 termsData 변수 업데이트
        if (typeof termsData !== 'undefined') {
            console.log('업데이트 전 termsData 개수:', termsData.length);
            const mergedTerms = ITQuizTerms.mergeTerms(termsData, newTermsData);
            termsData.length = 0;
            termsData.push(...mergedTerms);
            console.log('업데이트 후 termsData 개수:', termsData.length);
            console.log('업데이트 후 termsData 샘플:', termsData.slice(0, 3));
            
            // 💾 중요: localStorage에 업데이트된 데이터 저장
            saveTermsToLocalStorage(newTermsData);
            
            console.log('용어 데이터가 성공적으로 업데이트되었습니다.');
            
            // 사전 화면이 열려있으면 새로고침
            if (document.getElementById('dictionary-screen').classList.contains('active')) {
                showWelcomeMessage();
            }
            
            // 메인 화면의 용어 개수도 업데이트
            if (typeof updateTermsCount === 'function') {
                updateTermsCount();
            }
            
            // 업데이트 성공 알림
            showUpdateNotification('✅ 용어 데이터가 Google Sheets에서 성공적으로 업데이트되었습니다!');
            
            return true;
        } else {
            throw new Error('termsData 변수를 찾을 수 없습니다.');
        }
        
    } catch (error) {
        console.error('용어 데이터 업데이트 실패:', error);
        showUpdateNotification('❌ 용어 데이터 업데이트에 실패했습니다: ' + error.message, 'error');
        return false;
    }
}

/**
 * 업데이트 알림을 보여주는 함수
 */
function showUpdateNotification(message, type = 'success') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.update-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `update-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // 스타일 추가
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    // CSS 애니메이션 추가
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .notification-close:hover {
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * 자동 업데이트 설정 (선택사항)
 */
function setupAutoUpdate(intervalMinutes = 30) {
    if (!isGoogleSheetsConfigured()) {
        console.warn('Google Sheets가 설정되지 않아 자동 업데이트를 건너뜁니다.');
        return;
    }
    
    console.log(`${intervalMinutes}분마다 자동 업데이트가 설정되었습니다.`);
    
    setInterval(async () => {
        if (isGoogleSheetsConfigured()) {
            console.log('자동 업데이트 실행 중...');
            await updateTermsFromGoogleSheets();
        }
    }, intervalMinutes * 60 * 1000);
}

/**
 * CSV 내보내기 기능 (대안 방법)
 */
function downloadTemplateCSV() {
    const csvContent = [
        ['용어', '정의'],
        ['API', '애플리케이션 프로그래밍 인터페이스'],
        ['React', '사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리'],
        ['HTML', '웹페이지의 구조를 만드는 마크업 언어']
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'IT용어_템플릿.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * CSV 파일에서 데이터 가져오기
 */
function parseCSVRows(csv) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let index = 0; index < csv.length; index += 1) {
        const character = csv[index];

        if (inQuotes) {
            if (character === '"') {
                if (csv[index + 1] === '"') {
                    field += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += character;
            }
            continue;
        }

        if (character === '"' && field.trim() === '') {
            field = '';
            inQuotes = true;
        } else if (character === ',') {
            row.push(field);
            field = '';
        } else if (character === '\n' || character === '\r') {
            if (character === '\r' && csv[index + 1] === '\n') index += 1;
            row.push(field);
            if (row.some(cell => cell.trim())) rows.push(row);
            row = [];
            field = '';
        } else {
            field += character;
        }
    }

    if (inQuotes) throw new Error('CSV의 큰따옴표가 닫히지 않았습니다.');
    if (field || row.length) {
        row.push(field);
        if (row.some(cell => cell.trim())) rows.push(row);
    }

    return rows;
}

function loadFromCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const rows = parseCSVRows(csv);

                const data = rows.slice(1)
                    .map(values => {
                        return {
                            term: (values[0] || '').replace(/^\uFEFF/, '').trim(),
                            definition: (values[1] || '').trim()
                        };
                    })
                    .filter(item => item.term && item.definition);
                
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('파일 읽기에 실패했습니다.'));
        };
        
        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * localStorage에 용어 데이터 저장
 */
function saveTermsToLocalStorage(data) {
    try {
        const dataToSave = {
            terms: data,
            lastUpdated: new Date().toISOString(),
            source: 'google_sheets'
        };
        localStorage.setItem('quizTermsData', JSON.stringify(dataToSave));
        console.log('✅ 용어 데이터가 localStorage에 저장되었습니다.');
    } catch (error) {
        console.error('❌ localStorage 저장 실패:', error);
    }
}

/**
 * localStorage에서 용어 데이터 로드
 */
function loadTermsFromLocalStorage() {
    try {
        const saved = localStorage.getItem('quizTermsData');
        if (saved) {
            const data = JSON.parse(saved);
            console.log('📥 localStorage에서 용어 데이터를 불러왔습니다.');
            console.log('마지막 업데이트:', data.lastUpdated);
            console.log('데이터 소스:', data.source);
            console.log('용어 개수:', data.terms.length);
            return data.terms;
        }
        return null;
    } catch (error) {
        console.error('❌ localStorage 로드 실패:', error);
        return null;
    }
}

/**
 * 저장된 데이터 삭제 (원본 데이터로 복구)
 */
function clearSavedTermsData() {
    try {
        localStorage.removeItem('quizTermsData');
        console.log('🗑️ 저장된 용어 데이터를 삭제했습니다.');
        showUpdateNotification('✅ 원본 데이터로 복구되었습니다. 페이지를 새로고침해주세요.', 'success');
    } catch (error) {
        console.error('❌ 데이터 삭제 실패:', error);
        showUpdateNotification('❌ 데이터 삭제에 실패했습니다.', 'error');
    }
}

/**
 * 앱 초기화 시 저장된 데이터가 있으면 로드
 */
function initializeTermsData() {
    const savedData = loadTermsFromLocalStorage();
    if (savedData && savedData.length > 0) {
        if (typeof termsData !== 'undefined') {
            const mergedTerms = ITQuizTerms.mergeTerms(termsData, savedData);
            termsData.length = 0;
            termsData.push(...mergedTerms);
            console.log('🔄 저장된 데이터로 termsData를 초기화했습니다.');
            console.log('로드된 용어 개수:', termsData.length);
            
            // UI 업데이트
            if (typeof updateTermsCount === 'function') {
                updateTermsCount();
            }
            
            // 저장된 데이터 사용 중임을 콘솔에만 로그 (알림 제거)
            console.log('📱 저장된 Google Sheets 데이터를 사용 중입니다.');
        }
    } else {
        console.log('💡 저장된 데이터가 없어 원본 데이터를 사용합니다.');
    }
}

// 전역 함수로 내보내기
window.GoogleSheetsIntegration = {
    updateTermsFromGoogleSheets,
    setupAutoUpdate,
    downloadTemplateCSV,
    loadFromCSVFile,
    fetchDataFromGoogleSheets,
    saveTermsToLocalStorage,
    loadTermsFromLocalStorage,
    clearSavedTermsData,
    initializeTermsData
};
