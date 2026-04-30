import { memo, type ReactNode } from "react";
import { MathJax } from "better-react-mathjax";

interface MathLatexProps {
  style?: string;
  content: string;
  inline?: boolean;
  dynamic?: boolean;
}

/**
 * MathLatex component to render LaTeX mathematical expressions.
 *
 * @param {MathLatexProps} props
 * @returns {ReactNode}
 */
const MathLatexComponent = ({
  style = "",
  content,
  inline = true,
  dynamic = true,
}: MathLatexProps): ReactNode => {
  const displayClass = inline ? "inline-block" : "block";
  return (
    <span className={`${style} ${displayClass}`}>
      <MathJax inline={inline} dynamic={dynamic}>
        {content}
      </MathJax>
    </span>
  );
};

// Rapid parent re-renders (sliders) with unchanged props
// would spam MathJax.typesetPromise() calls when dynamic={true}
// this function spam would cause stack overflow
const MathLatex = memo(MathLatexComponent);
export default MathLatex;
