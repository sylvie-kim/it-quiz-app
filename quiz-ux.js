(function initQuizUX(root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.ITQuizUX = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createQuizUX() {
    function escapeHTML(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function formatAnswer(answer) {
        if (answer === true) return '참';
        if (answer === false) return '거짓';
        return String(answer ?? '응답 없음');
    }

    function buildFeedbackModel(question, isCorrect) {
        if (question.type !== 'true-false') {
            return {
                title: isCorrect ? '정답입니다' : '정답을 확인해보세요',
                summary: isCorrect ? '' : question.explanation || '',
                sections: [],
            };
        }

        if (question.correctAnswer === true) {
            if (isCorrect) {
                return { title: '정답입니다', summary: '', sections: [] };
            }

            return {
                title: '정답은 참입니다',
                summary: `${question.term}과(와) 제시된 정의는 올바르게 연결되어 있습니다.`,
                sections: [{
                    label: `${question.term}의 정의`,
                    term: question.term,
                    definition: question.termDefinition,
                }],
            };
        }

        return {
            title: isCorrect ? '정답입니다' : '정답은 거짓입니다',
            summary: '두 설명은 서로 다른 용어에 해당합니다.',
            sections: [
                {
                    label: `${question.term}의 실제 정의`,
                    term: question.term,
                    definition: question.termDefinition,
                },
                {
                    label: '문제에 나온 정의',
                    term: question.shownDefinitionTerm,
                    definition: question.shownDefinition,
                },
            ],
        };
    }

    function buildReviewItemHTML(answer, index) {
        const model = answer.feedbackModel || { title: '', summary: '', sections: [] };
        const sections = model.sections.map(section => `
            <div class="review-explanation">
                <span class="review-label">${escapeHTML(section.label)}</span>
                <strong>${escapeHTML(section.term)}</strong>
                <p>${escapeHTML(section.definition)}</p>
            </div>
        `).join('');

        return `
            <article class="review-item">
                <div class="review-item__index">${index + 1}</div>
                <div class="review-item__content">
                    <p class="review-question">${escapeHTML(answer.questionText)}</p>
                    <div class="review-answers">
                        <span>내 답: <strong>${escapeHTML(formatAnswer(answer.userAnswer))}</strong></span>
                        <span>정답: <strong>${escapeHTML(formatAnswer(answer.correctAnswer))}</strong></span>
                    </div>
                    ${model.summary ? `<p class="review-summary">${escapeHTML(model.summary)}</p>` : ''}
                    ${sections}
                </div>
            </article>
        `;
    }

    function shouldSubmitOnSelection(type) {
        return type === 'multiple-choice' || type === 'true-false';
    }

    return {
        buildFeedbackModel,
        buildReviewItemHTML,
        escapeHTML,
        formatAnswer,
        shouldSubmitOnSelection,
    };
}));
