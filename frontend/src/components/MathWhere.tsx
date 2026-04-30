import MathLatex from "./MathLatex";
import type { ReactNode } from "react";

interface MathWhereProps {
  content: [string, string][];
  style?: string;
}

/**
 * MathWhere component to display mathematical expressions with descriptions.
 * @param {MathWhereProps} props
 * @returns MathWhere component.
 */
const MathWhere = ({
  content,
  style = "mt-1 flex flex-row justify-around gap-1",
}: MathWhereProps): ReactNode => {
  return (
    <>
      ahol
      <div className={style}>
        {content.map(([math, desc], index) => (
          <div key={index}>
            <MathLatex content={`\\(${math}\\)`} />
            {desc}
          </div>
        ))}
      </div>
    </>
  );
};

export default MathWhere;
