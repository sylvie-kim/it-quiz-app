const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

function parseHexColor(value) {
    const match = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    assert.ok(match, `HEX 색상이 필요합니다: ${value}`);
    const hex = match[1].length === 3
        ? [...match[1]].map(channel => channel.repeat(2)).join('')
        : match[1];
    return hex.match(/../g).map(channel => Number.parseInt(channel, 16) / 255);
}

function relativeLuminance(hex) {
    const [red, green, blue] = parseHexColor(hex).map(channel =>
        channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4
    );

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
    const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
    const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
    return (lighter + 0.05) / (darker + 0.05);
}

function declarations(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
    assert.ok(match, `${selector} 선언을 찾을 수 없습니다.`);

    return Object.fromEntries(
        [...match[1].matchAll(/(--[\w-]+|[\w-]+)\s*:\s*([^;]+);/g)]
            .map(([, property, value]) => [property, value.trim()])
    );
}

function resolveColor(value, variables) {
    const variable = value.match(/^var\((--[\w-]+)\)$/);
    return variable ? variables[variable[1]] : value;
}

test('다크·라이트 모드의 주 버튼 글자는 배경과 4.5:1 이상 대비된다', () => {
    const light = declarations(':root');
    const dark = { ...light, ...declarations('[data-theme="dark"]') };
    const primaryButton = declarations('.button--primary');

    for (const [theme, variables] of [['라이트', light], ['다크', dark]]) {
        const foreground = resolveColor(primaryButton.color, variables);
        const background = resolveColor(primaryButton.background, variables);
        const ratio = contrastRatio(foreground, background);

        assert.ok(
            ratio >= 4.5,
            `${theme} 모드 주 버튼 대비가 ${ratio.toFixed(2)}:1입니다. 4.5:1 이상이어야 합니다.`
        );
    }
});
