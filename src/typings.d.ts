declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: {
    readonly [key: string]: string
  };
  export default content;
}