declare module 'react-mathjax2' {
  import * as React from 'react';

  export interface MathJaxContextProps {
    children: React.ReactNode;
    script?: string | boolean;
    options?: any;
    onError?: (MathJax: any, error: any) => void;
    onLoad?: () => void;
  }

  export class Context extends React.Component<MathJaxContextProps> {}

  export interface MathJaxTextProps {
    text: string;
    classes?: string;
  }
  export class Text extends React.Component<MathJaxTextProps> {}

  export interface MathJaxNodeProps {
    inline?: boolean;
    children: string;
    classes?: string;
  }
  export class Node extends React.Component<MathJaxNodeProps> {}
}
