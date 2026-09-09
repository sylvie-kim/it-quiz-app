const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

test('학습 지도는 주제·경로·상세 영역을 접근 가능한 컨트롤로 제공한다', () => {
    assert.match(html, /id="learning-map-screen"/);
    assert.match(html, /id="learning-topic-list"/);
    assert.match(html, /id="learning-path-flow"/);
    assert.match(html, /id="learning-detail"/);
    assert.match(html, /id="learning-map-status"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.match(html, /id="start-path-quiz"/);
    assert.match(html, /id="learning-map-btn"/);
});

test('학습 지도 화면 선택자는 데스크톱 3열 그리드와 직접 연결된다', () => {
    assert.match(
        html,
        /<section\s+id="learning-map-screen"\s+class="screen learning-map-screen"/,
    );

    const desktopMapCss = css.match(/\.learning-map-screen\s*\{([\s\S]*?)\}/)?.[1] || '';
    assert.match(
        desktopMapCss,
        /grid-template-columns:\s*280px minmax\(620px, 1fr\) 340px/,
    );
});

test('3열 지도의 최소 폭보다 좁은 중간 화면은 2열 레이아웃으로 전환해 가로 넘침을 막는다', () => {
    const desktopColumns = 280 + 620 + 340;
    const desktopGaps = 24 * 2;
    const mapOuterGutters = 48;
    const minimumThreeColumnViewport = desktopColumns + desktopGaps + mapOuterGutters;

    assert.equal(minimumThreeColumnViewport, 1336);
    assert.match(
        css,
        /@media \(min-width: 721px\) and \(max-width: 1335px\) \{[\s\S]*?\.learning-map-screen\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 240px\) minmax\(0, 1fr\)/,
    );

    // 1280px는 기존 3열 최소 폭(1288px)보다 좁으므로 반드시 중간 2열 범위에 들어가야 한다.
    assert.ok(1280 >= 721 && 1280 < minimumThreeColumnViewport);
});

test('중간 화면 지도는 부모 폭 안에서 렌더링하고 상세를 무한한 분야 목록 아래로 보내지 않는다', () => {
    const tabletCss = css.match(
        /@media \(min-width: 721px\) and \(max-width: 1335px\) \{([\s\S]*?)\n\}/,
    )?.[1] || '';
    assert.match(css, /\*,\s*\*::before,\s*\*::after\s*\{\s*box-sizing:\s*border-box/);
    assert.match(css, /@media \(min-width: 721px\) \{[\s\S]*?\.app-shell:has\(\.learning-map-screen\.active\)\s*\{[\s\S]*?width:\s*min\(calc\(100% - 48px\), 1440px\)/);
    assert.match(css, /@media \(min-width: 721px\) \{[\s\S]*?\.learning-map-screen\s*\{[\s\S]*?width:\s*100%;[\s\S]*?margin-left:\s*0;[\s\S]*?transform:\s*none/);
    assert.match(tabletCss, /grid-template-columns:\s*minmax\(0, 240px\) minmax\(0, 1fr\)/);
    assert.match(tabletCss, /grid-template-areas:\s*"sidebar stage"\s*"sidebar detail"/);
    assert.match(tabletCss, /\.learning-sidebar\s*\{[\s\S]*?grid-area:\s*sidebar;[\s\S]*?min-width:\s*0/);
    assert.match(tabletCss, /\.learning-stage\s*\{[\s\S]*?grid-area:\s*stage;[\s\S]*?min-width:\s*0/);
    assert.match(tabletCss, /\.learning-detail\s*\{[\s\S]*?grid-area:\s*detail;[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0/);
});

test('학습 경로의 긴 용어와 긴 분야 목록은 각 grid track 밖으로 밀어내지 않는다', () => {
    const tabletCss = css.match(
        /@media \(min-width: 721px\) and \(max-width: 1335px\) \{([\s\S]*?)\n\}/,
    )?.[1] || '';

    assert.match(css, /\.learning-path-flow__step,[\s\S]*?\.learning-mobile-path__step\s*\{[\s\S]*?min-width:\s*0/);
    assert.match(css, /\.learning-term-button\s*\{[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?white-space:\s*normal;[\s\S]*?overflow-wrap:\s*anywhere/);
    assert.match(css, /\.learning-path-flow__step > \.learning-term-button,[\s\S]*?\.learning-mobile-path__step > \.learning-term-button\s*\{[\s\S]*?width:\s*100%/);
    assert.match(tabletCss, /\.learning-sidebar\s*\{[\s\S]*?max-height:\s*calc\(100dvh - 96px\);[\s\S]*?overflow-y:\s*auto;[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*calc\(64px \+ var\(--space-4\)\)/);
    assert.doesNotMatch(tabletCss, /\.learning-sidebar\s*\{[\s\S]*?overflow:\s*hidden/);
});

test('온톨로지 데이터와 유틸은 지도 컨트롤러보다 먼저 로드된다', () => {
    const sources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
    assert.ok(sources.indexOf('ontology-schema.js') < sources.indexOf('learning-map.js'));
    assert.ok(sources.indexOf('ontology-data.js') < sources.indexOf('learning-map.js'));
    assert.ok(sources.indexOf('ontology-utils.js') < sources.indexOf('learning-map.js'));
});

test('정적 자산은 동일한 배포 버전과 학습 지도 의존성 순서를 사용한다', () => {
    const versionedAssets = [...html.matchAll(/(?:href|src)="(?:style\.css|[^\"]+\.js)\?v=([^"]+)"/g)]
        .map(match => match[1]);
    assert.ok(versionedAssets.length >= 10);
    assert.ok(versionedAssets.every(version => version === '20260909.7'));

    const sources = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match => match[1].split('?')[0]);
    assert.deepEqual(sources, [
        'terms-utils.js',
        'terms-data.js',
        'ontology-schema.js',
        'ontology-data.js',
        'ontology-utils.js',
        'quiz-ux.js',
        'quiz-content.js',
        'graph-insights.js',
        'ontology-insights.js',
        'ontology-graph.js',
        'learning-map.js',
        'ontology-graph-view.js',
        'glossary-learning.js',
        'app.js',
    ]);
});

test('학습 지도는 기존 화면 전환과 별도 버튼으로 연결된다', () => {
    const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
    assert.match(app, /data-open-learning-map/);
    assert.match(app, /showScreen\('learning-map-screen'\)/);
    assert.match(app, /showScreen\('dictionary-screen'\)/);
});

test('학습 분야 목록은 tab 역할을 흉내 내지 않고 경로 선택 버튼을 렌더링한다', () => {
    const learningMap = fs.readFileSync(path.join(root, 'learning-map.js'), 'utf8');
    assert.doesNotMatch(learningMap, /role="tab"/);
    assert.match(learningMap, /data-learning-path/);
    assert.match(learningMap, /함께 알아둘 용어/);
    assert.match(learningMap, /fitRationale/);
});

test('선택한 학습 경로의 제목·설명·퀴즈 대상은 본문과 버튼에서 함께 보인다', () => {
    const learningMap = fs.readFileSync(path.join(root, 'learning-map.js'), 'utf8');
    assert.match(learningMap, /learning-active-path/);
    assert.match(learningMap, /path\.title/);
    assert.match(learningMap, /path\.description/);
    assert.match(learningMap, /startQuiz\.textContent/);
});

test('390px에서 그래프를 단계 목록으로 바꾸고 가로 넘침을 막는다', () => {
    const mobileMapCss = css.match(
        /\/\* learning-map-mobile:start \*\/([\s\S]*?)\/\* learning-map-mobile:end \*\//,
    )?.[1] || '';
    assert.match(mobileMapCss, /\.learning-path-flow\s*\{[^}]*display:\s*none/s);
    assert.match(mobileMapCss, /\.learning-mobile-path\s*\{[^}]*display:\s*block/s);
    assert.match(mobileMapCss, /overflow-wrap:\s*anywhere/);
});
