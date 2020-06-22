"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prosemirror_state_1 = require("prosemirror-state");
const copy_to_clipboard_1 = __importDefault(require("copy-to-clipboard"));
const prosemirror_view_1 = require("prosemirror-view");
const prosemirror_inputrules_1 = require("prosemirror-inputrules");
const prosemirror_commands_1 = require("prosemirror-commands");
const backspaceToParagraph_1 = __importDefault(require("../commands/backspaceToParagraph"));
const toggleBlockType_1 = __importDefault(require("../commands/toggleBlockType"));
const headingToSlug_1 = __importDefault(require("../lib/headingToSlug"));
const Node_1 = __importDefault(require("./Node"));
class Heading extends Node_1.default {
    constructor() {
        super(...arguments);
        this.handleCopyLink = () => {
            return event => {
                const hash = `#${event.target.parentElement.parentElement.id}`;
                const urlWithoutHash = window.location.href.split("#")[0];
                copy_to_clipboard_1.default(urlWithoutHash + hash);
                if (this.options.onShowToast) {
                    this.options.onShowToast("Link copied to clipboard", "heading_copied");
                }
            };
        };
    }
    get name() {
        return "heading";
    }
    get defaultOptions() {
        return {
            levels: [1, 2, 3, 4],
        };
    }
    get schema() {
        return {
            attrs: {
                level: {
                    default: 1,
                },
            },
            content: "inline*",
            group: "block",
            defining: true,
            draggable: false,
            parseDOM: this.options.levels.map(level => ({
                tag: `h${level}`,
                attrs: { level },
            })),
            toDOM: node => {
                const button = document.createElement("button");
                button.innerText = "#";
                button.type = "button";
                button.className = "heading-anchor";
                button.addEventListener("click", this.handleCopyLink());
                return [
                    `h${node.attrs.level + (this.options.offset || 0)}`,
                    button,
                    ["span", 0],
                ];
            },
        };
    }
    toMarkdown(state, node) {
        state.write(state.repeat("#", node.attrs.level) + " ");
        state.renderInline(node);
        state.closeBlock(node);
    }
    parseMarkdown() {
        return {
            block: "heading",
            getAttrs: (token) => ({
                level: +token.tag.slice(1),
            }),
        };
    }
    commands({ type, schema }) {
        return (attrs) => {
            return toggleBlockType_1.default(type, schema.nodes.paragraph, attrs);
        };
    }
    keys({ type }) {
        const options = this.options.levels.reduce((items, level) => (Object.assign(Object.assign({}, items), {
            [`Shift-Ctrl-${level}`]: prosemirror_commands_1.setBlockType(type, { level }),
        })), {});
        return Object.assign(Object.assign({}, options), { Backspace: backspaceToParagraph_1.default(type) });
    }
    get plugins() {
        return [
            new prosemirror_state_1.Plugin({
                props: {
                    decorations: state => {
                        const { doc } = state;
                        const decorations = [];
                        const previouslySeen = {};
                        doc.descendants((node, pos) => {
                            if (node.type.name !== this.name)
                                return;
                            const slug = headingToSlug_1.default(node);
                            let id = slug;
                            if (previouslySeen[slug] > 0) {
                                id = headingToSlug_1.default(node, previouslySeen[slug]);
                            }
                            previouslySeen[slug] =
                                previouslySeen[slug] !== undefined
                                    ? previouslySeen[slug] + 1
                                    : 1;
                            decorations.push(prosemirror_view_1.Decoration.node(pos, pos + node.nodeSize, {
                                id,
                                class: "heading-name",
                                nodeName: "a",
                            }));
                        });
                        return prosemirror_view_1.DecorationSet.create(doc, decorations);
                    },
                },
            }),
        ];
    }
    inputRules({ type }) {
        return this.options.levels.map(level => prosemirror_inputrules_1.textblockTypeInputRule(new RegExp(`^(#{1,${level}})\\s$`), type, () => ({
            level,
        })));
    }
}
exports.default = Heading;
//# sourceMappingURL=Heading.js.map