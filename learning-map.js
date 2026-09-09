(function exposeLearningMap(root) {
    const ontologyUtils = typeof module === 'object' && module.exports
        ? require('./ontology-utils.js')
        : root.ITQuizOntologyUtils;
    const schema = typeof module === 'object' && module.exports
        ? require('./ontology-schema.js')
        : root.ITQuizOntologySchema;

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function escapeHTML(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function pathTermIds(path) {
        return [...new Set([
            ...list(path && path.primaryTermIds),
            ...list(path && path.supportingTermIds),
        ])];
    }

    function getPathsForTopic(ontology, topicId) {
        return list(ontology && ontology.learningPaths)
            .filter(path => list(path.topicIds).includes(topicId));
    }

    function buildLearningPathViewModel({ ontology, pathId } = {}) {
        const path = ontologyUtils.getLearningPath(ontology, pathId);
        return {
            id: path.id,
            title: path.title,
            description: path.description,
            primaryTermIds: [...list(path.primaryTermIds)],
            supportingTermIds: [...list(path.supportingTermIds)],
            fitAssessments: { ...(path.fitAssessments || {}) },
        };
    }

    function resolveSearchSelection({ ontology, termId } = {}) {
        const index = ontologyUtils.buildOntologyIndex(ontology);
        if (!index.termsById.has(termId)) throw new Error(`Unknown term: ${termId}`);
        const firstPath = (index.pathsByTermId.get(termId) || [])[0];
        if (!firstPath) throw new Error(`Term is not in a learning path: ${termId}`);
        return { pathId: firstPath.id, termId };
    }

    function getTermDetailModel({ ontology, terms, pathId, termId } = {}) {
        const registry = list(ontology && ontology.termRegistry).find(term => term && term.id === termId);
        if (!registry) throw new Error(`Unknown term: ${termId}`);
        const source = list(terms).find(term => term.term === registry.label);
        const activePath = list(ontology.learningPaths).find(path => path.id === pathId && pathTermIds(path).includes(termId))
            || (ontologyUtils.buildOntologyIndex(ontology).pathsByTermId.get(termId) || [])[0];
        const assessment = activePath && activePath.fitAssessments && activePath.fitAssessments[termId];
        return {
            registry,
            source,
            pathId: activePath ? activePath.id : '',
            fit: assessment ? assessment.fit : '',
            fitRationale: assessment ? assessment.fitRationale : '',
            reviewedRelations: reviewedRelations(ontology, termId).map(relation => ({
                ...relation,
                sourceRefs: [...list(relation.sourceRefs)],
            })),
        };
    }

    function createLearningMapState({ defaultPathId, paths = [] } = {}) {
        const pathById = new Map(list(paths).map(path => [path.id, path]));
        const firstPath = pathById.get(defaultPathId) || list(paths)[0];
        if (!firstPath) throw new Error('A learning path is required');
        const firstTermId = pathTermIds(firstPath)[0];
        if (!firstTermId) throw new Error(`Learning path requires a term: ${firstPath.id}`);

        return {
            pathId: firstPath.id,
            topicId: list(firstPath.topicIds)[0] || '',
            selectedTermId: firstTermId,
            selectedRelationId: '',
            selectPath(pathId, { topicId } = {}) {
                const nextPath = pathById.get(pathId);
                if (!nextPath) throw new Error(`Unknown learning path: ${pathId}`);
                this.pathId = nextPath.id;
                this.topicId = topicId || list(nextPath.topicIds)[0] || '';
                this.selectedTermId = pathTermIds(nextPath)[0] || '';
                this.selectedRelationId = '';
                return this;
            },
            selectTopic(topicId) {
                this.topicId = topicId;
                this.selectedRelationId = '';
                return this;
            },
            selectTerm(termId) {
                this.selectedTermId = termId;
                this.selectedRelationId = '';
                return this;
            },
            selectRelation(relationId) {
                this.selectedRelationId = relationId;
                return this;
            },
        };
    }

    function getElements(documentRef) {
        return {
            screen: documentRef.getElementById('learning-map-screen'),
            search: documentRef.getElementById('learning-map-search'),
            topicList: documentRef.getElementById('learning-topic-list'),
            pathFlow: documentRef.getElementById('learning-path-flow'),
            mobilePath: documentRef.getElementById('learning-mobile-path'),
            detail: documentRef.getElementById('learning-detail'),
            status: documentRef.getElementById('learning-map-status'),
            startQuiz: documentRef.getElementById('start-path-quiz'),
        };
    }

    function relationLabel(relation) {
        return schema && schema.RELATION_TYPES && schema.RELATION_TYPES[relation.type]
            ? schema.RELATION_TYPES[relation.type].label
            : relation.type;
    }

    function reviewedRelations(ontology, termId) {
        return list(ontology.relations).filter(relation =>
            relation && relation.status === 'REVIEWED'
            && (relation.source === termId || relation.target === termId));
    }

    function reviewedRelationsBetween(ontology, sourceId, targetId) {
        return list(ontology.relations).filter(relation =>
            relation && relation.status === 'REVIEWED'
            && ((relation.source === sourceId && relation.target === targetId)
                || (relation.source === targetId && relation.target === sourceId)));
    }

    function sourceRefText(sourceRef) {
        if (!sourceRef) return '';
        if (sourceRef.kind === 'term-definition') return `용어 정의: ${sourceRef.ref}`;
        if (sourceRef.kind === 'official-document') return `공식 문서: ${sourceRef.ref}`;
        return `${sourceRef.kind || '출처'}: ${sourceRef.ref || ''}`;
    }

    function hasMapElements(elements) {
        return Boolean(elements && elements.topicList && elements.pathFlow && elements.mobilePath && elements.detail);
    }

    function focusTargetFromActiveElement(documentRef) {
        const active = documentRef && documentRef.activeElement;
        if (!active || !active.dataset) return null;
        const fields = [
            ['term', 'learningTerm'],
            ['relation', 'learningRelation'],
            ['path', 'learningPath'],
            ['topic', 'learningTopic'],
        ];
        const match = fields.find(([, field]) => active.dataset[field]);
        return match ? { type: match[0], id: active.dataset[match[1]] } : null;
    }

    function restoreFocus(controller, focusTarget) {
        if (!focusTarget || !controller.documentRef || typeof controller.documentRef.querySelectorAll !== 'function') return;
        const selector = `[data-learning-${focusTarget.type}="${focusTarget.id}"]`;
        const candidates = [...controller.documentRef.querySelectorAll(selector)];
        const target = candidates.find(candidate => {
            if (typeof candidate.getClientRects !== 'function') return true;
            return candidate.getClientRects().length > 0;
        }) || candidates[0];
        if (!target || typeof target.focus !== 'function') return;
        try {
            target.focus({ preventScroll: true });
        } catch {
            target.focus();
        }
    }

    function ensureSearchResults(controller) {
        const { elements, documentRef } = controller;
        let container = documentRef.getElementById('learning-map-search-results');
        if (!container) {
            container = documentRef.createElement('div');
            container.id = 'learning-map-search-results';
            container.className = 'learning-map-search-results';
            elements.search.insertAdjacentElement('afterend', container);
        }
        return container;
    }

    function describeTerm(controller, termId) {
        const registry = controller.registryById.get(termId);
        const source = registry && controller.sourceByLabel.get(registry.label);
        return { registry, source };
    }

    function renderTopicList(controller) {
        const { ontology, state, elements } = controller;
        const allSelected = state.topicId === 'all-topics';
        const topics = list(ontology.topics);
        const allCount = controller.terms.length;
        elements.topicList.removeAttribute?.('role');
        elements.topicList.innerHTML = [
            `<button class="learning-topic-button${allSelected ? ' active' : ''}" type="button" data-learning-topic="all-topics" aria-pressed="${allSelected}">전체 용어 <span>${allCount}</span></button>`,
            ...topics.map(topic => {
                const selected = state.topicId === topic.id;
                const count = ontology.termRegistry.filter(term => list(term.topicIds).includes(topic.id)).length;
                const paths = getPathsForTopic(ontology, topic.id);
                return `<section class="learning-topic-choice"><button class="learning-topic-button${selected ? ' active' : ''}" type="button" data-learning-topic="${escapeHTML(topic.id)}" aria-pressed="${selected}">${escapeHTML(topic.label)} <span>${count}</span></button><div class="learning-path-choices">${paths.map(path => `<button class="learning-path-choice${state.pathId === path.id ? ' active' : ''}" type="button" data-learning-path="${escapeHTML(path.id)}" data-learning-path-topic="${escapeHTML(topic.id)}" aria-current="${state.pathId === path.id ? 'step' : 'false'}"><strong>${escapeHTML(path.title)}</strong><span>${escapeHTML(path.description)}</span></button>`).join('')}</div></section>`;
            }),
        ].join('');

        elements.topicList.querySelectorAll('[data-learning-topic]').forEach(button => {
            button.addEventListener('click', () => controller.selectTopic(button.dataset.learningTopic));
        });
        elements.topicList.querySelectorAll('[data-learning-path]').forEach(button => {
            button.addEventListener('click', () => controller.selectPath(button.dataset.learningPath, {
                topicId: button.dataset.learningPathTopic,
            }));
        });
    }

    function termButtonMarkup(term, { selected = false, mobile = false } = {}) {
        return `<button class="learning-term-button${selected ? ' active' : ''}${mobile ? ' learning-term-button--mobile' : ''}" type="button" data-learning-term="${escapeHTML(term.id)}" aria-pressed="${selected}">${escapeHTML(term.label)}</button>`;
    }

    function relationButtonMarkup(controller, relation) {
        const source = controller.registryById.get(relation.source);
        const target = controller.registryById.get(relation.target);
        const label = relationLabel(relation);
        const accessibleName = `${source ? source.label : relation.source}에서 ${target ? target.label : relation.target}로 연결: ${label}`;
        return `<button class="learning-relation-button" type="button" data-learning-relation="${escapeHTML(relation.id)}" aria-label="${escapeHTML(accessibleName)}">${escapeHTML(label)}</button>`;
    }

    function bindTermAndRelationControls(controller, container) {
        container.querySelectorAll('[data-learning-term]').forEach(button => {
            button.addEventListener('click', () => controller.selectTerm(button.dataset.learningTerm));
        });
        container.querySelectorAll('[data-learning-relation]').forEach(button => {
            button.addEventListener('click', () => controller.selectRelation(button.dataset.learningRelation));
        });
    }

    function renderPath(controller, path) {
        const { state, elements } = controller;
        const primaryIds = list(path.primaryTermIds);
        const supportingIds = list(path.supportingTermIds);
        const primaryTerms = primaryIds.map(id => controller.registryById.get(id)).filter(Boolean);
        const supportingTerms = supportingIds.map(id => controller.registryById.get(id)).filter(Boolean);

        const activePathMarkup = `<li class="learning-active-path"><p class="eyebrow">선택한 학습 경로</p><h2>${escapeHTML(path.title)}</h2><p>${escapeHTML(path.description)}</p></li>`;
        const flow = primaryTerms.map((term, index) => {
            const after = primaryTerms[index + 1];
            const links = after ? reviewedRelationsBetween(controller.ontology, term.id, after.id) : [];
            const relationControls = links.map(relation => relationButtonMarkup(controller, relation)).join('');
            return `<li class="learning-path-flow__step">${termButtonMarkup(term, { selected: state.selectedTermId === term.id })}${relationControls}</li>`;
        }).join('');
        const supportingMarkup = supportingTerms.length
            ? `<li class="learning-supporting-terms"><strong>함께 알아둘 용어</strong><div>${supportingTerms.map(term => termButtonMarkup(term, { selected: state.selectedTermId === term.id })).join('')}</div></li>`
            : '';
        elements.pathFlow.innerHTML = activePathMarkup + flow + supportingMarkup;

        elements.mobilePath.innerHTML = activePathMarkup + primaryTerms.map((term, index) => {
            const after = primaryTerms[index + 1];
            const links = after ? reviewedRelationsBetween(controller.ontology, term.id, after.id) : [];
            const relationControls = links.map(relation => relationButtonMarkup(controller, relation)).join('');
            return `<li class="learning-mobile-path__step">${termButtonMarkup(term, { selected: state.selectedTermId === term.id, mobile: true })}${relationControls}</li>`;
        }).join('') + (supportingTerms.length
            ? `<li class="learning-supporting-terms"><strong>함께 알아둘 용어</strong><div>${supportingTerms.map(term => termButtonMarkup(term, { selected: state.selectedTermId === term.id, mobile: true })).join('')}</div></li>`
            : '');

        bindTermAndRelationControls(controller, elements.pathFlow);
        bindTermAndRelationControls(controller, elements.mobilePath);
        if (elements.startQuiz) {
            elements.startQuiz.disabled = false;
            elements.startQuiz.dataset.learningPath = path.id;
            elements.startQuiz.textContent = `퀴즈 풀기 · ${path.title}`;
            elements.startQuiz.setAttribute('aria-label', `${path.title} 경로 퀴즈 풀기`);
        }
    }

    function renderAllTopics(controller) {
        const { ontology, state, elements } = controller;
        elements.pathFlow.innerHTML = list(ontology.topics).map(topic => {
            const terms = ontology.termRegistry.filter(term => list(term.topicIds).includes(topic.id));
            return `<li class="learning-topic-group"><h2>${escapeHTML(topic.label)} <span>${terms.length}</span></h2><div>${terms.map(term => termButtonMarkup(term, { selected: state.selectedTermId === term.id })).join('')}</div></li>`;
        }).join('');
        elements.mobilePath.innerHTML = elements.pathFlow.innerHTML;
        bindTermAndRelationControls(controller, elements.pathFlow);
        bindTermAndRelationControls(controller, elements.mobilePath);
        if (elements.startQuiz) {
            elements.startQuiz.disabled = true;
            delete elements.startQuiz.dataset.learningPath;
            elements.startQuiz.textContent = '학습 경로를 선택해 퀴즈 풀기';
            elements.startQuiz.removeAttribute('aria-label');
        }
    }

    function renderDetail(controller) {
        const { state, elements, ontology } = controller;
        const selectedRelation = list(ontology.relations).find(relation => relation && relation.id === state.selectedRelationId && relation.status === 'REVIEWED');
        const detail = getTermDetailModel({
            ontology,
            terms: controller.terms,
            pathId: state.pathId,
            termId: state.selectedTermId,
        });
        const { registry, source } = detail;
        const returnControl = '<button class="text-button" type="button" data-learning-return>학습지도로 돌아가기</button>';

        if (selectedRelation) {
            const sourceTerm = controller.registryById.get(selectedRelation.source);
            const targetTerm = controller.registryById.get(selectedRelation.target);
            elements.detail.innerHTML = `${returnControl}<p class="eyebrow">검토된 연결</p><h2>${escapeHTML(relationLabel(selectedRelation))}</h2><p><strong>${escapeHTML(sourceTerm ? sourceTerm.label : selectedRelation.source)}</strong> → <strong>${escapeHTML(targetTerm ? targetTerm.label : selectedRelation.target)}</strong></p><p>${escapeHTML(selectedRelation.rationale || '')}</p><h3>근거</h3><ul>${list(selectedRelation.sourceRefs).map(ref => `<li>${escapeHTML(sourceRefText(ref))}</li>`).join('')}</ul>`;
        } else if (registry && source) {
            const connections = detail.reviewedRelations;
            const related = connections.length
                ? `<h3>검토된 연결</h3><ul>${connections.map(relation => {
                    const otherId = relation.source === registry.id ? relation.target : relation.source;
                    const other = controller.registryById.get(otherId);
                    return `<li><button class="text-button" type="button" data-learning-relation="${escapeHTML(relation.id)}">${escapeHTML(other ? other.label : otherId)} · ${escapeHTML(relationLabel(relation))}</button></li>`;
                }).join('')}</ul>`
                : '<p class="learning-detail__empty">이 용어와 직접 연결되는 관계는 아직 확인되지 않았어요.</p>';
            elements.detail.innerHTML = `${returnControl}<p class="eyebrow">선택한 용어</p><h2>${escapeHTML(registry.label)}</h2><p>${escapeHTML(source.definition)}</p>${related}`;
        } else {
            elements.detail.innerHTML = `${returnControl}<p class="learning-detail__placeholder">학습 분야나 용어를 선택하면 여기에서 짧은 정의와 연결 근거를 확인할 수 있습니다.</p>`;
        }

        elements.detail.querySelector('[data-learning-return]')?.addEventListener('click', () => controller.onReturnToDictionary());
        bindTermAndRelationControls(controller, elements.detail);
        if (elements.startQuiz) elements.detail.append(elements.startQuiz);
    }

    function renderSearchResults(controller, query) {
        const container = ensureSearchResults(controller);
        const trimmed = String(query || '').trim();
        if (!trimmed) {
            container.innerHTML = '';
            return;
        }
        const results = ontologyUtils.searchOntologyTerms({
            terms: controller.terms,
            termRegistry: controller.ontology.termRegistry,
            pathsByTermId: controller.index.pathsByTermId,
            query: trimmed,
        }).slice(0, 8);
        container.innerHTML = results.length
            ? `<p>${results.length}개 결과</p><ul>${results.map(result => `<li><button class="text-button" type="button" data-learning-search-term="${escapeHTML(result.id)}">${escapeHTML(result.label)}</button></li>`).join('')}</ul>`
            : '<p>일치하는 용어가 없습니다.</p>';
        container.querySelectorAll('[data-learning-search-term]').forEach(button => {
            button.addEventListener('click', () => controller.selectSearchResult(button.dataset.learningSearchTerm));
        });
    }

    function renderLearningMap(controller, focusTarget) {
        const { state, ontology, elements } = controller;
        if (!hasMapElements(elements)) return;
        renderTopicList(controller);
        if (state.topicId === 'all-topics') {
            renderAllTopics(controller);
        } else {
            const path = ontology.learningPaths.find(item => item.id === state.pathId) || ontology.learningPaths[0];
            renderPath(controller, path);
        }
        renderDetail(controller);
        if (elements.status) {
            const selected = controller.registryById.get(state.selectedTermId);
            elements.status.textContent = selected ? `${selected.label}을 선택했습니다.` : '연결 정보를 업데이트했습니다.';
        }
        restoreFocus(controller, focusTarget || focusTargetFromActiveElement(controller.documentRef));
    }

    function createLearningMapController({
        ontology = root.IT_QUIZ_ONTOLOGY,
        terms = root.IT_QUIZ_BASE_TERMS,
        documentRef = root.document,
        elements = documentRef && getElements(documentRef),
        defaultPathId = list(ontology && ontology.learningPaths)[0] && ontology.learningPaths[0].id,
        onStartQuiz = () => {},
        onReturnToDictionary = () => {},
    } = {}) {
        if (!ontology) throw new Error('Ontology is required');
        const index = ontologyUtils.buildOntologyIndex(ontology);
        const controller = {
            ontology,
            terms: list(terms),
            documentRef,
            elements,
            index,
            state: createLearningMapState({ defaultPathId, paths: ontology.learningPaths }),
            registryById: index.termsById,
            sourceByLabel: new Map(list(terms).map(term => [term.term, term])),
            onStartQuiz,
            onReturnToDictionary,
            lastFocusTarget: null,
            render(focusTarget = null) {
                this.lastFocusTarget = focusTarget || focusTargetFromActiveElement(this.documentRef);
                renderLearningMap(this, this.lastFocusTarget);
                return this;
            },
            selectPath(pathId, { topicId } = {}) {
                this.state.selectPath(pathId, { topicId });
                return this.render({ type: 'path', id: pathId });
            },
            selectTopic(topicId) {
                if (topicId === 'all-topics') {
                    this.state.selectTopic(topicId);
                    return this.render({ type: 'topic', id: topicId });
                }
                const path = ontology.learningPaths.find(item => list(item.topicIds)[0] === topicId)
                    || ontology.learningPaths.find(item => list(item.topicIds).includes(topicId));
                if (path) this.state.selectPath(path.id, { topicId });
                else this.state.selectTopic(topicId);
                return this.render({ type: 'topic', id: topicId });
            },
            selectTerm(termId) {
                if (!this.registryById.has(termId)) throw new Error(`Unknown term: ${termId}`);
                this.state.selectTerm(termId);
                return this.render({ type: 'term', id: termId });
            },
            selectRelation(relationId) {
                const relation = list(ontology.relations).find(item => item && item.id === relationId && item.status === 'REVIEWED');
                if (!relation) throw new Error(`Unknown reviewed relation: ${relationId}`);
                this.state.selectRelation(relationId);
                return this.render({ type: 'relation', id: relationId });
            },
            selectSearchResult(termId) {
                const selection = resolveSearchSelection({ ontology, termId });
                this.state.selectPath(selection.pathId);
                this.state.selectTerm(selection.termId);
                if (elements && elements.search) elements.search.value = '';
                if (hasMapElements(elements) && documentRef) renderSearchResults(this, '');
                return this.render({ type: 'term', id: selection.termId });
            },
            startPathQuiz(pathId = this.state.pathId) {
                const path = ontologyUtils.getLearningPath(ontology, pathId);
                this.onStartQuiz(path.id);
                return path.id;
            },
        };

        elements?.search?.addEventListener('input', event => renderSearchResults(controller, event.target.value));
        elements?.startQuiz?.addEventListener('click', () => {
            const pathId = elements.startQuiz.dataset.learningPath;
            if (pathId) controller.startPathQuiz(pathId);
        });
        return controller;
    }

    const api = {
        createLearningMapController,
        createLearningMapState,
        buildLearningPathViewModel,
        getPathsForTopic,
        getTermDetailModel,
        resolveSearchSelection,
        restoreFocus,
        renderLearningMap,
    };
    root.ITQuizLearningMap = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
