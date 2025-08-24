// This declaration file adds the 'lottie-player' custom element to JSX's
// intrinsic elements, allowing it to be used in TSX files without type errors.

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        background?: string;
        speed?: string;
        // style is already part of React.DetailedHTMLProps
        loop?: boolean;
        autoplay?: boolean;
        mode?: "normal" | "bounce";
        controls?: boolean;
      }, HTMLElement>;
    }
  }
}
