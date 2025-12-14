declare module 'react-masonry-css' {
    import * as React from 'react';

    export interface MasonryProps {
        breakpointCols?: number | { [key: number]: number };
        className?: string;
        columnClassName?: string;
        children?: React.ReactNode;
        style?: React.CSSProperties;
    }

    export default class Masonry extends React.Component<MasonryProps> { }
}
