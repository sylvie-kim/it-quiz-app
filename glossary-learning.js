(function exposeGlossaryLearning(root) {
    const stages = [
        { title: '준비하기', paths: ['path-runtime-and-commands', 'path-ai-coding-tools'] },
        { title: '화면 만들기', paths: ['path-web-page-basics', 'path-web-rendering', 'path-app-framework-choice'] },
        { title: '정보 연결하기', paths: ['path-api-system-connection', 'path-backend-cloud-auth', 'path-data-files', 'path-data-analysis'] },
        { title: 'AI 활용하기', paths: ['path-llm-agents', 'path-machine-learning'] },
        { title: '공개하기', paths: ['path-git-collaboration', 'path-web-deployment'] },
        { title: '써보고 고치기', paths: ['path-interface-design', 'path-product-building'] },
    ];
    const steps = [
        { name: 'HTML', role: '버튼을 놓아요', title: '버튼이 생겼어요', message: '지금은 버튼의 자리만 만들었어요.', caption: 'HTML이 화면의 뼈대를 만들어요.', next: '다음: 색과 모양 입히기 →' },
        { name: 'CSS', role: '색과 모양을 입혀요', title: '색과 모양이 달라졌어요', message: '파란색과 둥근 모서리를 입혔어요.', caption: 'CSS가 HTML로 만든 버튼을 꾸며요.', next: '다음: 클릭 동작 더하기 →' },
        { name: 'JavaScript', role: '누르면 반응하게 해요', title: '이제 버튼을 눌러보세요', message: '누르면 인사말이 나타나요.', caption: 'JavaScript가 버튼에 클릭 동작을 더해요.', next: '세 가지 역할, 한 문제로 확인 →' },
    ];

    function pathTerms(path) {
        return [...new Set([...(path.primaryTermIds || []), ...(path.supportingTermIds || [])])];
    }

    function getTermContext(ontology, termId) {
        const term = ontology.termRegistry.find(item => item.id === termId);
        if (!term) throw new Error(`Unknown term: ${termId}`);
        return {
            term,
            paths: ontology.learningPaths.filter(path => pathTerms(path).includes(termId)),
            relations: ontology.relations.filter(relation => relation.status === 'REVIEWED'
                && (relation.source === termId || relation.target === termId)
                && relation.rationale && relation.sourceRefs?.length),
        };
    }

    function createLessonState() {
        return {
            step: 0, quizOpen: false, answer: '',
            select(step) {
                if (!Number.isInteger(step) || !steps[step]) throw new Error('Unknown lesson step');
                this.step = step; this.quizOpen = false; this.answer = '';
                return this;
            },
            next() {
                if (this.step < steps.length - 1) return this.select(this.step + 1);
                this.quizOpen = true;
                return this;
            },
            grade(answer) {
                if (!this.quizOpen || !steps.some(step => step.name === answer)) return null;
                this.answer = answer;
                return answer === 'CSS';
            },
        };
    }

    function mount({ documentRef = root.document, ontology, terms, onStartQuiz, onShowLearning }) {
        const container = documentRef.getElementById('learning-home-screen');
        const q = selector => documentRef.querySelector(selector);
        const qa = selector => [...container.querySelectorAll(selector)];
        const state = createLessonState();
        const registry = new Map(ontology.termRegistry.map(term => [term.id, term]));
        const paths = new Map(ontology.learningPaths.map(path => [path.id, path]));
        const sources = new Map(terms.map(term => [term.term, term]));
        const dialog = q('#glossary-term-dialog');
        const heading = q('#glossary-path-title');
        let selectedPathId = '';
        let returnFocus;
        let pathAfterClose;
        function element(tag, text, className) {
            const node = documentRef.createElement(tag);
            node.textContent = text;
            if (className) node.className = className;
            return node;
        }
        function button(text, action, className = 'gl-term-button') {
            const node = element('button', text, className);
            node.type = 'button'; node.addEventListener('click', action);
            return node;
        }
        function renderLesson() {
            const step = steps[state.step];
            qa('[data-gl-step]').forEach((node, index) => {
                node.setAttribute('aria-pressed', String(index === state.step));
                node.querySelector('.gl-role-mark').textContent = index === state.step ? '→' : '+';
            });
            q('#gl-demo-label').textContent = `${state.step + 1} / 3 · ${step.title}`;
            q('#gl-demo-button').classList.toggle('is-styled', state.step > 0);
            q('#gl-demo-feedback').textContent = step.message;
            q('#gl-caption').textContent = step.caption;
            q('#gl-next').textContent = step.next;
            q('#gl-quiz').hidden = !state.quizOpen;
            q('#gl-quiz-feedback').textContent = '';
            q('#gl-continue').hidden = true;
        }
        qa('[data-gl-step]').forEach(node => node.addEventListener('click', () => {
            state.select(Number(node.dataset.glStep)); renderLesson();
        }));
        q('#gl-demo-button').addEventListener('click', () => {
            q('#gl-demo-feedback').textContent = state.step === 2
                ? '안녕하세요! 클릭에 반응했어요.'
                : '클릭 반응은 JavaScript에서 더해볼 거예요.';
        });
        q('#gl-next').addEventListener('click', () => {
            state.next(); renderLesson();
            if (state.quizOpen) q('#gl-quiz-title').focus();
        });
        qa('[data-gl-answer]').forEach(node => node.addEventListener('click', () => {
            const correct = state.grade(node.dataset.glAnswer);
            if (correct === null) return;
            q('#gl-quiz-feedback').textContent = correct
                ? '맞아요. CSS가 버튼의 색과 모양을 정해요.'
                : '색과 모양은 CSS가 맡아요. HTML은 구조, JavaScript는 동작을 만들어요.';
            q('#gl-continue').hidden = !correct;
        }));
        q('#gl-continue').addEventListener('click', () => showPath('path-web-page-basics'));

        function showTerm(termId) {
            const context = getTermContext(ontology, termId);
            q('#glossary-term-title').textContent = context.term.label;
            const body = q('#glossary-term-body');
            body.replaceChildren(element('p', sources.get(context.term.label)?.definition || '정의를 준비하고 있어요.'));
            body.append(element('h3', '어디에 쓰이나요?'));
            context.paths.forEach(path => {
                const stage = stages.find(stage => stage.paths.includes(path.id));
                body.append(button(`${stage?.title || '학습 경로'} · ${path.title} →`, () => {
                    pathAfterClose = path.id; dialog.close();
                }, 'gl-path-link'));
            });
            body.append(element('h3', '직접 연결되는 용어'));
            if (!context.relations.length) body.append(element('p', '아직 확인된 연결이 없어요. 같은 학습 경로의 용어부터 함께 살펴보세요.', 'gl-muted'));
            context.relations.forEach(relation => {
                const from = registry.get(relation.source), to = registry.get(relation.target);
                const related = registry.get(relation.source === termId ? relation.target : relation.source);
                const row = element('div', '', 'gl-relation');
                const type = root.ITQuizOntologySchema.RELATION_TYPES[relation.type]?.label || relation.type;
                row.append(element('p', `${from.label} → ${to.label}`), element('p', type, 'gl-muted'), element('p', relation.rationale));
                const sourceList = element('details', '');
                sourceList.append(element('summary', '연결 근거 보기'));
                relation.sourceRefs.forEach(ref => sourceList.append(element('p', `${ref.kind === 'term-definition' ? '용어 정의' : '출처'}: ${registry.get(ref.ref)?.label || ref.ref}`, 'gl-source')));
                row.append(sourceList, button(`${related.label} 살펴보기 →`, () => showTerm(related.id), 'text-button'));
                body.append(row);
            });
            if (!dialog.open) { returnFocus = documentRef.activeElement; dialog.showModal(); }
            q('#glossary-term-title').focus();
        }
        q('#glossary-term-close').addEventListener('click', () => dialog.close());
        dialog.addEventListener('close', () => {
            if (pathAfterClose) {
                const id = pathAfterClose; pathAfterClose = ''; showPath(id);
            } else if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
        });
        function termList(ids) {
            const list = element('div', '', 'gl-term-list');
            ids.forEach(id => {
                const term = registry.get(id);
                if (!term) return;
                const item = element('article', '', 'gl-path-term');
                item.append(element('h4', term.label), element('p', sources.get(term.label)?.definition || '정의를 준비하고 있어요.'));
                const connection = button('학습 위치와 연결 보기 →', () => showTerm(id), 'text-button');
                connection.setAttribute('aria-label', `${term.label} 학습 위치와 연결 보기`);
                item.append(connection);
                list.append(item);
            });
            return list;
        }
        function showPath(pathId) {
            const path = paths.get(pathId);
            if (!path) return;
            onShowLearning();
            q('#gl-intro').hidden = true;
            selectedPathId = path.id;
            q('#gl-map-groups').hidden = true;
            q('#gl-journey').hidden = false;
            q('#gl-map-back').hidden = false;
            q('#glossary-path').hidden = false;
            heading.textContent = path.title;
            q('#gl-start-lesson').hidden = path.id !== 'path-web-page-basics';
            q('#glossary-path-description').textContent = path.description;
            const primary = path.id === 'path-web-page-basics'
                ? [...new Set(['term-html', 'term-css', 'term-javascript', ...path.primaryTermIds])]
                : path.primaryTermIds;
            q('#gl-primary-terms').replaceChildren(termList(primary));
            q('#gl-supporting-terms').replaceChildren(termList(path.supportingTermIds));
            qa('[data-gl-path]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.glPath === pathId)));
            const stageIndex = stages.findIndex(stage => stage.paths.includes(pathId));
            qa('[data-gl-stage]').forEach((node, i) => {
                if (i === stageIndex) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
                node.querySelector('small').textContent = i === stageIndex ? '지금 여기' : '';
            });
            heading.focus();
        }
        stages.forEach((stage, i) => {
            const step = element('li', ''); step.dataset.glStage = i;
            step.append(button(stage.title, () => showPath(stage.paths[0]), 'gl-stage-button'), element('small', ''));

            q('#gl-journey').append(step);
            const group = element('section', '', 'gl-map-group');
            group.append(element('p', `0${i + 1}`, 'gl-map-number'), element('h3', stage.title));
            const purposes = ['코드를 작성하고 실행할 도구', '사용자가 보고 누르는 화면', '서버와 데이터를 주고받는 방법', 'AI에 정보를 주고 일을 맡기는 방법', '변경 내용을 관리하고 다른 사람에게 공개하기', '사용해 보며 제품을 다듬는 방법'];
            group.append(element('p', purposes[i], 'gl-map-purpose'));
            stage.paths.forEach(id => {
                const path = paths.get(id);
                if (!path) return;
                const node = button(`${path.title} →`, () => showPath(id), 'gl-path-link');
                node.dataset.glPath = id; node.setAttribute('aria-pressed', 'false');
                group.append(node);
            });
            q('#gl-map-groups').append(group);
        });
        q('#gl-path-quiz').addEventListener('click', () => { if (selectedPathId) onStartQuiz(selectedPathId); });
        documentRef.addEventListener('click', event => {
            const target = event.target.closest('[data-gl-term]');
            if (target) showTerm(target.dataset.glTerm);
        });
        renderLesson();
        function reset() {
            state.select(0); renderLesson();
            q('#gl-intro').hidden = true;
            selectedPathId = '';
            q('#gl-map-groups').hidden = false;
            q('#gl-journey').hidden = true;
            q('#gl-map-back').hidden = true;
            q('#glossary-path').hidden = true;
            qa('[data-gl-path]').forEach(node => node.setAttribute('aria-pressed', 'false'));
            qa('[data-gl-stage]').forEach((node, i) => {
                node.removeAttribute('aria-current');
                node.querySelector('small').textContent = '';
            });
        }
        q('#gl-restart').addEventListener('click', () => {
            reset(); q('[data-gl-path]').focus();
        });
        q('#gl-map-back').addEventListener('click', () => { reset(); q('[data-gl-path]').focus(); });
        q('#gl-start-lesson').addEventListener('click', () => {
            state.select(0); renderLesson();
            q('#glossary-path').hidden = true;
            q('#gl-intro').hidden = false;
            q('#learning-home-title').focus();
        });
        q('#gl-close-lesson').addEventListener('click', () => showPath('path-web-page-basics'));
        reset();
        return { showPath, showTerm, state, reset };
    }
    const api = { stages, steps, pathTerms, getTermContext, createLessonState, mount };
    root.ITQuizGlossaryLearning = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
