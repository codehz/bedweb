export default interface HybridsElement<T extends HTMLElement | ShadowRoot = HTMLElement | ShadowRoot> extends HTMLElement {
  render(): HTMLElement | ShadowRoot
}