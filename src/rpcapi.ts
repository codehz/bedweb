export interface RPCApi {
  ping(): string;

  sysinfo: {
    cpuid(): CPUID | null;
    cpustat(): CPUStatGroup;
    sysinfo(): SYSInfo;
    diskspace(path?: string): DiskSpace;
    users(): Passwd[];
    groups(): Group[];
    current_user(): ServerUserInfo;
  };

  fs: {
    ls(path: string): FileEntry[];
    tree(path: string): FileEntry[];
    pread(path: string, offset: number, size: number): { blob: number | undefined };
    pwrite(path: string, offset: number, id: number): number;
    copy(source: string, target: string, options?: CopyOptions): void;
    symlink(source: string, target: string): void;
    hardlink(source: string, target: string): void;
    mkdir(target: string): void;
    realpath(target: string): string;
    resize(target: string, size: number): void;
    remove(target: string): number;
    exists(target: string): boolean;
    stat(target: string): FileStatus;
    lstat(target: string): FileStatus;
  };

  shell: {
    open_shell(): number;
    open(program: string, args: string[]): number;
    open_id(id: number): number;
    get_orphan_list(): number[];
    resize(id: number, row: number, col: number): void;
    unlink(id: number): void;
    close(id: number): void;
  }
}

export interface ServerUserInfo {
  uid: number;
  euid: number;
  gid: number;
  egid: number;
  groups: string[];
}

export interface Passwd {
  uid: number;
  gid: number;
  username: string;
  realname: string;
  home: string;
  shell: string;
}

export interface Group {
  gid: number;
  name: string;
  members: string[];
}

export interface CopyOptions {
  skip_existing: boolean;
  overwrite_existing: boolean;
  update_existing: boolean;
  recursive: boolean;
  copy_symlinks: boolean;
  skip_symlinks: boolean;
  directories_only: boolean;
  create_symlinks: boolean;
  create_hard_links: boolean;
}

export type FileType = "regular" | "directory" | "block" | "character" | "socket" | "fifo" | "symlink" | "unknown";

export interface FileEntry {
  name: string;
  type: FileType;
  perm: number;
  link: number;
  time: number;
}

export interface FileStatus {
  type: FileType;
  perm: number;
}

export type CPUStatGroup = {
  global: CPUStat;
  separated: CPUStat[];
  time: number
};

export interface RPCApiEvent {
  ["sysinfo.cpustat"]: CPUStatGroup;
  ["sysinfo.sysinfo"]: SYSInfo;
  ["sysinfo.diskspace"]: { path: string; info: DiskSpace };
}

export interface CPUID {
  vendor: string;
  brand: string;
  codename: string;
  family: number;
  model: number;
  stepping: number;
  ext_family: number;
  ext_model: number;
  cores: number;
  logical_cores: number;
  total_logical_cores: number;
  l1_data_cache: number;
  l1_instruction_cache: number;
  l2_cache: number;
  l3_cache: number;
  l4_cache: number;
  l1_assoc: number;
  l2_assoc: number;
  l3_assoc: number;
  l4_assoc: number;
  l1_cacheline: number;
  l2_cacheline: number;
  l3_cacheline: number;
  l4_cacheline: number;
  sse_size: number;
}

export interface CPUStat {
  user: number;
  nice: number;
  systm: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
  guest: number;
  guest_nice: number;
}

export interface SYSInfo {
  uptime: number;
  loads: [number, number, number];
  totalram: number;
  freeram: number;
  sharedram: number;
  bufferram: number;
  totalswap: number;
  freeswap: number;
  procs: number;
  totalhigh: number;
  freehigh: number;
  mem_unit: number;
}

export interface DiskSpace {
  capacity: number;
  free: number;
  available: number;
}