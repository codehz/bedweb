import { html, Hybrids, Descriptor, RenderFunction, property } from 'hybrids';


interface XTerm extends HTMLElement {
  // terminal?: Htre;
  render: () => ShadowRoot
}