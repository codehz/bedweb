import tabContext, { TabContext } from "./tab-context";
import { Hybrids, parent, render, property, html, Descriptor, children } from "hybrids";
import HybridsElement from "~hybrids-element";
import { FileEntry, FileType } from "~rpcapi";
import css from "./file-explorer.css";
import { iconFile, iconFolder, iconOpenedFolder, iconConnect, iconLink, iconPlugin } from "~res/icons";

interface FileExplorer extends HybridsElement {
  path: string;
}
interface FileListRenderer extends HybridsElement {
  context: TabContext;
  filelist: Promise<FileEntry[]>;
  path: string;
}
interface FolderRenderer extends HybridsElement {
  opened: boolean;
  entry: FileEntry;
  path: string;
}

function renderFileType(type: FileType) {
  if (type == "regular") return html`<icon-file></icon-file>`.define({ iconFile })
  if (type == "directory") return html`<icon-folder></icon-folder>`.define({ iconFolder })
  if (type == "socket") return html`<icon-connect></icon-connect>`.define({ iconConnect })
  if (type == "symlink") return html`<icon-link></icon-link>`.define({ iconLink })
  return html`<icon-plugin></icon-plugin>`.define({ iconPlugin })
}

const renderEntry = (path: string) => (entry: FileEntry) => entry.type == "directory"
  ? html`<folder-renderer entry=${entry} path=${path + "/" + entry.name}></folder-renderer>`.key(entry.name).define({ folderRenderer })
  : html`<div class="item">${renderFileType(entry.type)}<span>${entry.name}</span></div>`.key(entry.name);

function renderList(filelist: FileEntry[], path: string) {
  return filelist.map(renderEntry(path));
}

function toggleFolder(host: FolderRenderer, ev: MouseEvent) {
  ev.stopPropagation();
  host.opened = !host.opened;
}

const folderRenderer = {
  entry: property(undefined),
  path: property("/"),
  opened: property(false),
  render: render(({ opened, entry, path }) => html`
    <div class=${{ folder: true, opened }} onclick=${toggleFolder}>
      <div class=item>
        ${opened ? html`<icon-opened-folder></icon-opened-folder>`.define({ iconOpenedFolder }) : html`<icon-folder></icon-folder>`.define({ iconFolder })}
        <span>${entry.name}</span>
      </div>${opened && html`<file-list-renderer path=${path}></file-list-renderer>`}</div>
  `, { shadowRoot: false })
} as Hybrids<FolderRenderer>;

const fileListRenderer = {
  path: property("/"),
  context: parent(x => x === tabContext),
  filelist: ({context, path}) => context.api.fs.ls(path),
  render: render(({ filelist, path }) => html`
    <div class=container>
      ${html.resolve(filelist.then(list => html`${renderList(list, path)}`).catch(e => html`<div class=error>${e + ""}</div>`), html`<div class=loading>Loading</div>`)}
    </div>
  `, { shadowRoot: false })
} as Hybrids<FileListRenderer>

export default {
  path: property("/"),
  render: render(({ path }) => html`
    <file-list-renderer path=${path}></file-list-renderer>
  `.style(css).define({ fileListRenderer }))
} as Hybrids<FileExplorer>