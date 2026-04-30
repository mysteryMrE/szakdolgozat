import { useEffect, useState, type ReactNode } from "react";
import MathLatex from "../../MathLatex";
import { RotateCcw, ChevronRight, ChevronLeft } from "lucide-react";
import BackpropVisual from "./BackpropVisual";
import type { BackpropAnimStep as AnimStep } from "../../../types";
import { useWindowSize } from "../../../contexts/WindowSizeContext";

declare global {
  interface Window {
    MathJax?: {
      typesetClear?: () => void;
    };
  }
}

const StageContentWrapper = ({
  content,
  title,
}: {
  content: ReactNode;
  title: ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="font-semibold text-lg">{title}</div>
      {content}
    </div>
  );
};

interface StepData {
  x1: number;
  x2: number;
  target: [number, number];
  w1: [[number, number], [number, number]];
  b1: [number, number];
  w2: [[number, number], [number, number]];
  b2: [number, number];
  z1: [number, number];
  a1: [number, number];
  z2: [number, number];
  a2: [number, number];
  loss: number;
  dOutput: [number, number];
  dActivation1: [number, number];
  dHidden: [number, number];
  dw1: [[number, number], [number, number]];
  db1: [number, number];
  dw2: [[number, number], [number, number]];
  db2: [number, number];
  newW1: [[number, number], [number, number]];
  newB1: [number, number];
  newW2: [[number, number], [number, number]];
  newB2: [number, number];
  newLoss: number;
  ReLUDerivative: (x: number) => number;
}

interface StepConfig {
  id: AnimStep;
  content: (data: StepData) => ReactNode;
}

// Step content configurations
const STEP_CONFIGS: StepConfig[] = [
  {
    id: "inputs",
    content: (data) => (
      <StageContentWrapper
        title={<>Bemenet és cél.</>}
        content={
          <>
            <div className="flex flex-row items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex
                content={`\\( x = \\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} \\)`}
              />
              <MathLatex
                content={`\\( y = \\begin{bmatrix} y_1 \\\\ y_2 \\end{bmatrix} \\)`}
              />
            </div>
            <div className="flex flex-row items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <MathLatex
                content={`\\( x = \\begin{bmatrix} ${data.x1} \\\\ ${data.x2} \\end{bmatrix} \\)`}
              />
              <MathLatex
                content={`\\( y = \\begin{bmatrix} ${data.target[0]} \\\\ ${data.target[1]} \\end{bmatrix} \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "inputToHidden",
    content: (data) => (
      <StageContentWrapper
        title={<>Rejtett réteg értékei.</>}
        content={
          <>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex
                content={`\\( W^{(1)} = \\begin{bmatrix} W_{11}^{(1)} & W_{12}^{(1)} \\\\ W_{21}^{(1)} & W_{22}^{(1)} \\end{bmatrix} \\)`}
              />
              <MathLatex
                content={`\\( b^{(1)} = \\begin{bmatrix} b_{1}^{(1)} \\\\ b_{2}^{(1)} \\end{bmatrix} \\)`}
              />
            </div>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <MathLatex
                content={`\\( W^{(1)} = \\begin{bmatrix} ${data.w1[0][0]} & ${data.w1[0][1]} \\\\ ${data.w1[1][0]} & ${data.w1[1][1]} \\end{bmatrix} \\)`}
              />
              <MathLatex
                content={`\\( b^{(1)} = \\begin{bmatrix} ${data.b1[0]} \\\\ ${data.b1[1]} \\end{bmatrix} \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "hiddenPreActivation",
    content: (data) => (
      <StageContentWrapper
        title={<>Rejtett réteg súlyozott összeg.</>}
        content={
          <>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex
                content={`\\( z^{(1)} = W^{(1)} \\\\ x + b^{(1)} \\)`}
              />
              <MathLatex
                content={`\\( z^{(1)}_{j} = \\sum_{i=1}^{k} W^{(1)}_{ji} x_{i} + b^{(1)}_{j} \\)`}
              />
            </div>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <MathLatex
                content={`\\(
                        \\begin{aligned}
                          z^{(1)} &= \\begin{bmatrix} ${data.w1[0][0]} & ${data.w1[0][1]} \\\\ ${data.w1[1][0]} & ${data.w1[1][1]} \\end{bmatrix} \\cdot \\begin{bmatrix} ${data.x1} \\\\ ${data.x2} \\end{bmatrix} + \\begin{bmatrix} ${data.b1[0]} \\\\ ${data.b1[1]} \\end{bmatrix} \\\\
                                  &= \\begin{bmatrix} ${data.z1[0]} \\\\ ${data.z1[1]} \\end{bmatrix}
                        \\end{aligned}
                      \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "hiddenActivation",
    content: (data) => (
      <StageContentWrapper
        title={<>Rejtett réteg aktivációs érték.</>}
        content={
          <>
            <div className="flex flex-row items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex content={`\\( a^{(1)} = f(z^{(1)}) \\)`} />
            </div>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <div className="flex flex-col items-center justify-center gap-2">
                <MathLatex content={`\\( f = ReLU \\)`} />
                <MathLatex content={`\\( ReLU(x) = max(0, x) \\)`} />
              </div>
              <MathLatex
                content={`\\( a^{(1)} = \\begin{bmatrix} f(${data.z1[0]}) \\\\ f(${data.z1[1]}) \\end{bmatrix} = \\begin{bmatrix} ${data.a1[0]} \\\\ ${data.a1[1]} \\end{bmatrix} \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "hiddenToOutput",
    content: (data) => (
      <StageContentWrapper
        title={<>Kimeneti réteg értékei.</>}
        content={
          <>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex
                content={`\\( W^{(2)} = \\begin{bmatrix} W_{11}^{(2)} & W_{12}^{(2)} \\\\ W_{21}^{(2)} & W_{22}^{(2)} \\end{bmatrix} \\)`}
              />
              <MathLatex
                content={`\\( b^{(2)} = \\begin{bmatrix} b_{1}^{(2)} \\\\ b_{2}^{(2)} \\end{bmatrix} \\)`}
              />
            </div>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <MathLatex
                content={`\\( W^{(2)} = \\begin{bmatrix} ${data.w2[0][0]} & ${data.w2[0][1]} \\\\ ${data.w2[1][0]} & ${data.w2[1][1]} \\end{bmatrix} \\)`}
              />
              <MathLatex
                content={`\\( b^{(2)} = \\begin{bmatrix} ${data.b2[0]} \\\\ ${data.b2[1]} \\end{bmatrix} \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "outputPreActivation",
    content: (data) => (
      <StageContentWrapper
        title={<>Kimeneti réteg súlyozott összeg.</>}
        content={
          <>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex
                content={`\\( z^{(2)} = W^{(2)} \\\\ a^{(1)} + b^{(2)} \\)`}
              />
              <MathLatex
                content={`\\( z^{(2)}_{j} = \\sum_{i=1}^{k} W^{(2)}_{ji} a^{(1)}_{i} + b^{(2)}_{j} \\)`}
              />
            </div>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <MathLatex
                content={`\\(
                          \\begin{aligned}
                            z^{(2)} &= \\begin{bmatrix} ${data.w2[0][0]} & ${data.w2[0][1]} \\\\ ${data.w2[1][0]} & ${data.w2[1][1]} \\end{bmatrix} \\cdot \\begin{bmatrix} ${data.a1[0]} \\\\ ${data.a1[1]} \\end{bmatrix} \\\\
                                    &\\quad \\ + \\begin{bmatrix} ${data.b2[0]} \\\\ ${data.b2[1]} \\end{bmatrix} = \\begin{bmatrix} ${data.z2[0]} \\\\ ${data.z2[1]} \\end{bmatrix}
                          \\end{aligned}
                        \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "outputSoftmax",
    content: (data) => (
      <StageContentWrapper
        title={<>Kimeneti réteg aktivációs érték.</>}
        content={
          <>
            <div className="flex flex-row items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex content={`\\( \\hat{y} = f(z^{(2)}) \\)`} />
            </div>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <div className="flex flex-col items-center justify-center gap-2">
                <MathLatex content={`\\( f = Softmax \\)`} />
                <MathLatex
                  content={`\\( Softmax(z_{i}) = \\dfrac{\\large e^{\\Large z_{i}}}{\\sum_{j=1}^{K} \\large e^{\\Large z_{j}}} \\)`}
                />
                <MathLatex content={`\\( K = 2\\)`} />
              </div>
              <MathLatex
                content={`\\( \\hat{y} = f\\Biggl(\\begin{bmatrix} ${data.z2[0]} \\\\ ${data.z2[1]} \\end{bmatrix}\\Biggr) = \\begin{bmatrix} ${data.a2[0]} \\\\ ${data.a2[1]} \\end{bmatrix} \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "errorCalculation",
    content: (data) => (
      <StageContentWrapper
        title={<>Veszteség számítás.</>}
        content={
          <>
            <div className="flex flex-row items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex content={`\\( L = f(\\hat{y}, y) \\)`} />
            </div>
            <div className="flex flex-col normal:flex-row items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <div className="flex flex-col items-center justify-center gap-2">
                <MathLatex content={`\\( f = CEL \\)`} />
                <MathLatex
                  content={`\\( CEL(\\hat{y}, y) = -\\sum_{i=1}^{K} y_{i} \\log(\\hat{y}_{i}) \\)`}
                />
                <MathLatex content={`\\( K = 2\\)`} />
              </div>
              <MathLatex
                content={`\\( L = - \\\\ \\begin{bmatrix} ${data.target[0]} \\\\ ${data.target[1]} \\end{bmatrix}^T \\cdot \\begin{bmatrix} \\ln(${data.a2[0]}) \\\\ \\ln(${data.a2[1]}) \\end{bmatrix} = ${data.loss} \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "errorDerivativesWRTWeightedSumOutput",
    content: (data) => (
      <StageContentWrapper
        title={
          <>
            A veszteség (<MathLatex content={`\\( L \\)`} />) a kimeneti réteg
            súlyozott összegével (<MathLatex content={`\\( z^{(2)} \\)`} />)
            vett parciális deriváltja, azaz a kimeneti réteg{" "}
            <span className="italic">hiba deltája</span>.
          </>
        }
        content={
          <>
            <p>
              Amikor a kimeneti rétegen Softmax-ot használunk aktivációs
              függvényként és a veszteség függvény a keresztentrópia, akkor ez a
              derivált nagyon szépen leegyszerűsödik, és csak a kapott és a várt
              eloszlás különbsége:
            </p>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Általánosan:</p>
              <MathLatex
                content={`\\( \\delta^{(2)} = \\begin{bmatrix} \\delta^{(2)}_{1} \\\\ \\delta^{(2)}_{2} \\end{bmatrix} \\)`}
              />
              <MathLatex
                content={`\\( \\delta^{(2)}_{j} = \\dfrac{\\partial L}{\\partial z^{(2)}_{j}} = \\hat{y}_{j} - y_{j} \\)`}
              />
            </div>
            <div className="flex md:flex-row flex-col items-center justify-center gap-4">
              <p>Esetünkben:</p>
              <MathLatex
                content={`\\( \\delta^{(2)} = \\begin{bmatrix} ${data.a2[0]} - ${data.target[0]} \\\\ ${data.a2[1]} - ${data.target[1]} \\end{bmatrix} = \\begin{bmatrix} ${data.dOutput[0]} \\\\ ${data.dOutput[1]} \\end{bmatrix} \\)`}
              />
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "errorDerivativesWRTActivationHidden",
    content: (data) => (
      <StageContentWrapper
        title={
          <>
            A veszteség (<MathLatex content={`\\( L \\)`} />) a rejtett réteg
            aktivációs értékével (<MathLatex content={`\\( a^{(1)} \\)`} />)
            vett parciális deriváltja.
          </>
        }
        content={
          <>
            <p>
              A láncszabályt kihasználva nem előről kezdjük a parciális derivált
              számítását, hanem felhasználjuk a kimeneti réteg{" "}
              <span className="italic">hiba deltáját</span>.
            </p>
            <MathLatex
              content={`\\( \\dfrac{\\partial L}{\\partial a^{(1)}} = \\dfrac{\\partial L}{\\partial z^{(2)}} \\cdot \\dfrac{\\partial z^{(2)}}{\\partial a^{(1)}} \\)`}
            />
            <div className="flex flex-col md:flex-row md:gap-1 gap-2 justify-center items-center">
              <span>Azt már tudjuk, hogy </span>
              <span>
                <MathLatex
                  content={`\\( \\dfrac{\\partial L}{\\partial z^{(2)}} = \\delta^{(2)} = \\begin{bmatrix} ${data.dOutput[0]} \\\\ ${data.dOutput[1]} \\end{bmatrix} \\)`}
                />
                .
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:gap-1 gap-2 justify-center items-center">
              <span>
                Mivel{" "}
                <MathLatex
                  content={`\\( z^{(2)} = W^{(2)} \\\\ a^{(1)} + b^{(2)} \\)`}
                />
                ,
              </span>
              {"ezért könnyen belátható, hogy"}
              <span>
                <MathLatex
                  content={`\\( \\dfrac{\\partial z^{(2)}}{\\partial a^{(1)}} = W^{(2)} \\)`}
                />
                .
              </span>
            </div>
            <div className="w-full">
              <p>Összerakva, a mátrix dimenziókat figyelembe véve:</p>
              <div className="w-fit max-w-full mx-auto">
                <div className="flex flex-col gap-2 mt-2 md:flex-row md:justify-center md:items-center">
                  <MathLatex
                    inline={true}
                    content={`\\( \\dfrac{\\partial L}{\\partial a^{(1)}} = (W^{(2)})^\\mathsf{T} \\\\ \\delta^{(2)}  \\)`}
                  />

                  <div className="flex flex-col gap-1 sm:flex-row md:items-center">
                    <MathLatex
                      inline={true}
                      content={`\\( = \\begin{bmatrix} ${data.w2[0][0]} & ${data.w2[1][0]} \\\\ ${data.w2[0][1]} & ${data.w2[1][1]} \\end{bmatrix} \\cdot \\begin{bmatrix} ${data.dOutput[0]} \\\\ ${data.dOutput[1]} \\end{bmatrix} \\)`}
                    />
                    <MathLatex
                      inline={true}
                      content={`\\( = \\begin{bmatrix} ${data.dActivation1[0]} \\\\ ${data.dActivation1[1]} \\end{bmatrix} \\)`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "errorDerivativesWRTWeightedSumHidden",
    content: (data) => (
      <StageContentWrapper
        title={
          <>
            A veszteség (<MathLatex content={`\\( L \\)`} />) a rejtett réteg
            súlyozott összegével (<MathLatex content={`\\( z^{(1)} \\)`} />)
            vett parciális deriváltja, azaz a rejtett réteg{" "}
            <span className="italic">hiba deltája</span>.
          </>
        }
        content={
          <>
            <p>
              A láncszabályt kihasználva nem előről kezdjük a parciális derivált
              számítását, hanem felhasználjuk a réteg aktivációs értékének{" "}
              <span className="italic">hiba deltáját</span>:
            </p>
            <MathLatex
              content={`\\( \\delta^{(1)} = \\dfrac{\\partial L}{\\partial z^{(1)}} = \\dfrac{\\partial L}{\\partial a^{(1)}} \\cdot \\dfrac{\\partial a^{(1)}}{\\partial z^{(1)}} \\)`}
            />
            <div className="flex flex-col md:flex-row md:gap-1 gap-2 justify-center items-center">
              <p>Azt már tudjuk, hogy</p>
              <span>
                <MathLatex
                  content={`\\( \\dfrac{\\partial L}{\\partial a^{(1)}} = \\begin{bmatrix} ${data.dActivation1[0]} \\\\ ${data.dActivation1[1]} \\end{bmatrix} \\)`}
                />
                .
              </span>
            </div>
            <div className="flex flex-col gap-2 justify-center items-center">
              <p>Azt is tudjuk, hogy</p>
              <div className="flex flex-row flex-wrap items-baseline justify-center gap-2">
                <MathLatex content={`\\( a^{(1)} = ReLU(z^{(1)}) \\)`} />

                <p className="m-0">és</p>

                <div className="flex flex-row items-baseline gap-1">
                  <MathLatex
                    content={`\\( ReLU'(x) = \\begin{cases} 1, & x > 0 \\\\ 0, & x \\leq 0 \\end{cases} \\)`}
                  />
                  <span>,</span>
                </div>
              </div>
              <p>ezért</p>
              <span>
                <MathLatex
                  content={`\\( \\dfrac{\\partial a^{(1)}}{\\partial z^{(1)}} = \\begin{bmatrix} ReLU'(${
                    data.z1[0]
                  }) \\\\ ReLU'(${
                    data.z1[1]
                  }) \\end{bmatrix} = \\begin{bmatrix} ${data.ReLUDerivative(
                    data.z1[0],
                  )} \\\\ ${data.ReLUDerivative(data.z1[1])} \\end{bmatrix} \\)`}
                />
                .
              </span>
            </div>
            <div className="w-full flex flex-col gap-2">
              <div className="text-center">Összerakva: </div>
              <div className="w-fit max-w-full mx-auto">
                <div className="flex flex-col items-start gap-2 mt-2 md:flex-row md:justify-center">
                  <MathLatex
                    content={`\\( \\delta^{(1)} =  \\dfrac{\\partial L}{\\partial z^{(1)}} = \\dfrac{\\partial L}{\\partial a^{(1)}} \\cdot \\dfrac{\\partial a^{(1)}}{\\partial z^{(1)}} \\)`}
                  />
                  <MathLatex
                    content={`\\( = \\begin{bmatrix} ${
                      data.dActivation1[0]
                    } \\\\ ${
                      data.dActivation1[1]
                    } \\end{bmatrix} \\odot \\begin{bmatrix} ${data.ReLUDerivative(
                      data.z1[0],
                    )} \\\\ ${data.ReLUDerivative(
                      data.z1[1],
                    )} \\end{bmatrix} = \\begin{bmatrix} ${data.dHidden[0]} \\\\ ${
                      data.dHidden[1]
                    } \\end{bmatrix} \\)`}
                  />
                </div>
              </div>
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "weightAndBiasDeltas",
    content: (data) => (
      <StageContentWrapper
        title={
          <>
            A veszteség (<MathLatex content={`\\( L \\)`} />) súlyokkal és
            torzításokkal (
            <MathLatex content={`\\( W^{(1)}, b^{(1)}, W^{(2)}, b^{(2)} \\)`} />
            ) vett parciális deriváltja.
          </>
        }
        content={
          <>
            <p>
              A hálózat összes rétegéhez tartozó hiba delta kiszámolása után
              egyszerűen megmondhatjuk a súlyok és torzítások gradienseit.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <p>Általánosan:</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-10 ">
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(l)}_{ji}} = \\delta^{(l)}_{j} \\cdot a^{(l-1)}_{i} \\)`}
                  />
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial b^{(l)}_{j}} = \\delta^{(l)}_{j} \\)`}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-5 text-sm sm:text-base">
                <p className="text-base">Esetünkben:</p>
                <div className="flex flex-col normal:flex-row justify-center items-center gap-5 normal:gap-10">
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(1)}_{11}} = \\delta^{(1)}_{1} \\cdot (a^{(0)}_{1} = x_1) = ${data.dHidden[0]} \\cdot ${data.x1} = ${data.dw1[0][0]} \\)`}
                  />
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(1)}_{12}} = \\delta^{(1)}_{1} \\cdot (a^{(0)}_{2} = x_2) = ${data.dHidden[0]} \\cdot ${data.x2} = ${data.dw1[0][1]} \\)`}
                  />
                </div>
                <div className="flex flex-col normal:flex-row justify-center items-center gap-5 normal:gap-10">
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(1)}_{21}} = \\delta^{(1)}_{2} \\cdot (a^{(0)}_{1} = x_1) = ${data.dHidden[1]} \\cdot ${data.x1} = ${data.dw1[1][0]} \\)`}
                  />
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(1)}_{22}} = \\delta^{(1)}_{2} \\cdot (a^{(0)}_{2} = x_2) = ${data.dHidden[1]} \\cdot ${data.x2} = ${data.dw1[1][1]} \\)`}
                  />
                </div>
                <div className="flex flex-col normal:flex-row justify-center items-center gap-5 normal:gap-10">
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial b^{(1)}_{1}} = \\delta^{(1)}_{1} = ${data.db1[0]} \\)`}
                  />
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial b^{(1)}_{2}} = \\delta^{(1)}_{2} = ${data.db1[1]} \\)`}
                  />
                </div>
                <div className="flex flex-col normal:flex-row justify-center items-center gap-5 normal:gap-10">
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(2)}_{11}} = \\delta^{(2)}_{1} \\cdot a^{(1)}_{1} = ${data.dOutput[0]} \\cdot ${data.a1[0]} = ${data.dw2[0][0]} \\)`}
                  />
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(2)}_{12}} = \\delta^{(2)}_{1} \\cdot a^{(1)}_{2} = ${data.dOutput[0]} \\cdot ${data.a1[1]} = ${data.dw2[0][1]} \\)`}
                  />
                </div>
                <div className="flex flex-col normal:flex-row justify-center items-center gap-5 normal:gap-10">
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(2)}_{21}} = \\delta^{(2)}_{2} \\cdot a^{(1)}_{1} = ${data.dOutput[1]} \\cdot ${data.a1[0]} = ${data.dw2[1][0]} \\)`}
                  />
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial W^{(2)}_{22}} = \\delta^{(2)}_{2} \\cdot a^{(1)}_{2} = ${data.dOutput[1]} \\cdot ${data.a1[1]} = ${data.dw2[1][1]} \\)`}
                  />
                </div>
                <div className="flex flex-col normal:flex-row justify-center items-center gap-5 normal:gap-10">
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial b^{(2)}_{1}} = \\delta^{(2)}_{1} = ${data.db2[0]} \\)`}
                  />
                  <MathLatex
                    content={`\\( \\dfrac{\\partial L}{\\partial b^{(2)}_{2}} = \\delta^{(2)}_{2} = ${data.db2[1]} \\)`}
                  />
                </div>
              </div>
            </div>
          </>
        }
      />
    ),
  },
  {
    id: "weightBiasUpdate",
    content: (data) => (
      <StageContentWrapper
        title={<>Súlyok és torzítások frissítése.</>}
        content={
          <>
            <div>
              A frissítés a gradiens irányával ellentétesen történik, egy
              tanulási rátával (<MathLatex content={`\\( \\eta \\)`} />)
              súlyozva:
            </div>
            <div>
              A tanulási ráta egy pici szám, ami meghatározza, hogy mekkora
              lépéseket teszünk a gradiens mentén. Ha túl nagy, akkor
              "átugorhatjuk" a minimumot, ha túl kicsi, akkor nagyon lassan
              konvergálunk. Általában 0.01 és 0.0001 közötti értékeket szokás
              használni. Itt legyen{" "}
              <MathLatex content={`\\( \\eta = 0.1 \\)`} /> a látható
              változásért.
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center justify-center gap-2">
                <p>Általánosan:</p>
                <div className="flex md:flex-row flex-col justify-center items-center gap-2 md:gap-10">
                  <MathLatex
                    content={`\\( W^{(l)}_{ji} = W^{(l)}_{ji} - \\eta \\\\ \\dfrac{\\partial L}{\\partial W^{(l)}_{ji}} \\)`}
                  />
                  <MathLatex
                    content={`\\(   b^{(l)}_{j} = b^{(l)}_{j} - \\eta \\\\ \\dfrac{\\partial L}{\\partial b^{(l)}_{j}} \\)`}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-5">
                <p>Esetünkben, a frissítés utáni mátrixok:</p>
                <div className="flex md:flex-row flex-col justify-center items-center gap-2 md:gap-10">
                  <MathLatex
                    content={`\\( W^{(1)} = \\begin{bmatrix} ${data.newW1[0][0]} & ${data.newW1[0][1]} \\\\ ${data.newW1[1][0]} & ${data.newW1[1][1]} \\end{bmatrix} \\)`}
                  />
                  <MathLatex
                    content={`\\( b^{(1)} = \\begin{bmatrix} ${data.newB1[0]} \\\\ ${data.newB1[1]} \\end{bmatrix} \\)`}
                  />
                </div>
                <div className="flex md:flex-row flex-col justify-center items-center gap-2 md:gap-10">
                  <MathLatex
                    content={`\\( W^{(2)} = \\begin{bmatrix} ${data.newW2[0][0]} & ${data.newW2[0][1]} \\\\ ${data.newW2[1][0]} & ${data.newW2[1][1]} \\end{bmatrix} \\)`}
                  />
                  <MathLatex
                    content={`\\( b^{(2)} = \\begin{bmatrix} ${data.newB2[0]} \\\\ ${data.newB2[1]} \\end{bmatrix} \\)`}
                  />
                </div>
              </div>
            </div>
            <p>
              Ezekkel az új értékekkel a veszteség {data.newLoss} lett (előzőleg{" "}
              {data.loss} volt). Úgy tűnik tehát, hogy érdemes volt számolgatni!
              Csináljuk addig, amíg a veszteség elég kicsi nem lesz!
            </p>
          </>
        }
      />
    ),
  },
];

const STEP_ORDER: AnimStep[] = [
  "inputs",
  "inputToHidden",
  "hiddenPreActivation",
  "hiddenActivation",
  "hiddenToOutput",
  "outputPreActivation",
  "outputSoftmax",
  "errorCalculation",
  "errorDerivativesWRTWeightedSumOutput",
  "errorDerivativesWRTActivationHidden",
  "errorDerivativesWRTWeightedSumHidden",
  "weightAndBiasDeltas",
  "weightBiasUpdate",
];

const getStepIndex = (step: AnimStep): number => STEP_ORDER.indexOf(step);
const getNextStep = (step: AnimStep): AnimStep => {
  const index = getStepIndex(step);
  return STEP_ORDER[(index + 1) % STEP_ORDER.length]!;
};
const getPreviousStep = (step: AnimStep): AnimStep => {
  const index = getStepIndex(step);
  return STEP_ORDER[(index - 1 + STEP_ORDER.length) % STEP_ORDER.length]!;
};

const ReLU = (x: number) => Math.max(0, x);
const ReLUDerivative = (x: number) => (x > 0 ? 1 : 0);

const softmax = (z: number[]) => {
  const maxZ = Math.max(...z);
  const expZ = z.map((val) => Math.exp(val - maxZ));
  const sumExpZ = expZ.reduce((a, b) => a + b, 0);
  return expZ.map((val) => val / sumExpZ);
};
const crossEntropyLoss = (predicted: number[], target: number[]) => {
  return -target.reduce(
    (sum, t, i) => sum + t * Math.log(predicted[i]! + 1e-15),
    0,
  );
};

const x1 = 1.0;
const x2 = 2.0;
const learningRate = 0.1;
const w1: [[number, number], [number, number]] = [
  [0.1, -0.2],
  [0.4, 0.3],
];
const b1: [number, number] = [0.0, -0.1];
const w2: [[number, number], [number, number]] = [
  [0.2, -0.5],
  [0.1, 0.4],
];
const b2: [number, number] = [0.05, -0.05];
const target: [number, number] = [1, 0];

const computeStepData = () => {
  // hidden
  const z1_0 = Number((w1[0][0] * x1 + w1[0][1] * x2 + b1[0]).toFixed(2));
  const z1_1 = Number((w1[1][0] * x1 + w1[1][1] * x2 + b1[1]).toFixed(2));
  const a1_0 = Number(ReLU(z1_0).toFixed(2));
  const a1_1 = Number(ReLU(z1_1).toFixed(2));

  // output
  const z2_0 = Number((w2[0][0] * a1_0 + w2[0][1] * a1_1 + b2[0]).toFixed(2));
  const z2_1 = Number((w2[1][0] * a1_0 + w2[1][1] * a1_1 + b2[1]).toFixed(2));
  const a2_vals = softmax([z2_0, z2_1]);
  const a2_0 = Number(a2_vals[0]!.toFixed(2));
  const a2_1 = Number(a2_vals[1]!.toFixed(2));

  // Loss
  const lossVal = Number(
    crossEntropyLoss([a2_0, a2_1], [target[0], target[1]]).toFixed(2),
  );

  // Gradient for output layer
  const d2_0 = Number((a2_0 - target[0]).toFixed(2));
  const d2_1 = Number((a2_1 - target[1]).toFixed(2));

  // Gradient for hidden layer activation
  const dActivation1_0 = Number((d2_0 * w2[0][0] + d2_1 * w2[1][0]).toFixed(2));
  const dActivation1_1 = Number((d2_0 * w2[0][1] + d2_1 * w2[1][1]).toFixed(2));

  // Gradient for hidden layer
  const dHidden_0 = Number((dActivation1_0 * ReLUDerivative(z1_0)).toFixed(2));
  const dHidden_1 = Number((dActivation1_1 * ReLUDerivative(z1_1)).toFixed(2));

  // Weight and bias gradients
  const dw1_00 = Number((dHidden_0 * x1).toFixed(2));
  const dw1_01 = Number((dHidden_0 * x2).toFixed(2));
  const dw1_10 = Number((dHidden_1 * x1).toFixed(2));
  const dw1_11 = Number((dHidden_1 * x2).toFixed(2));
  const db1_0 = Number(dHidden_0.toFixed(2));
  const db1_1 = Number(dHidden_1.toFixed(2));

  const dw2_00 = Number((d2_0 * a1_0).toFixed(2));
  const dw2_01 = Number((d2_0 * a1_1).toFixed(2));
  const dw2_10 = Number((d2_1 * a1_0).toFixed(2));
  const dw2_11 = Number((d2_1 * a1_1).toFixed(2));
  const db2_0 = Number(d2_0.toFixed(2));
  const db2_1 = Number(d2_1.toFixed(2));

  // New weights, biases and loss after update
  const newW1_00 = Number((w1[0][0] - learningRate * dw1_00).toFixed(2));
  const newW1_01 = Number((w1[0][1] - learningRate * dw1_01).toFixed(2));
  const newW1_10 = Number((w1[1][0] - learningRate * dw1_10).toFixed(2));
  const newW1_11 = Number((w1[1][1] - learningRate * dw1_11).toFixed(2));
  const newB1_0 = Number((b1[0] - learningRate * db1_0).toFixed(2));
  const newB1_1 = Number((b1[1] - learningRate * db1_1).toFixed(2));

  const newW2_00 = Number((w2[0][0] - learningRate * dw2_00).toFixed(2));
  const newW2_01 = Number((w2[0][1] - learningRate * dw2_01).toFixed(2));
  const newW2_10 = Number((w2[1][0] - learningRate * dw2_10).toFixed(2));
  const newW2_11 = Number((w2[1][1] - learningRate * dw2_11).toFixed(2));
  const newB2_0 = Number((b2[0] - learningRate * db2_0).toFixed(2));
  const newB2_1 = Number((b2[1] - learningRate * db2_1).toFixed(2));

  // Recalculate loss
  const hiddenWeighted1 = newW1_00 * x1 + newW1_01 * x2 + newB1_0;
  const hiddenWeighted2 = newW1_10 * x1 + newW1_11 * x2 + newB1_1;
  const hiddenActivated1 = ReLU(hiddenWeighted1);
  const hiddenActivated2 = ReLU(hiddenWeighted2);

  const outputWeighted1 =
    newW2_00 * hiddenActivated1 + newW2_01 * hiddenActivated2 + newB2_0;
  const outputWeighted2 =
    newW2_10 * hiddenActivated1 + newW2_11 * hiddenActivated2 + newB2_1;
  const outputSoftmax = softmax([outputWeighted1, outputWeighted2]);
  const newLossVal = Number(
    crossEntropyLoss(
      [outputSoftmax[0]!, outputSoftmax[1]!],
      [target[0], target[1]],
    ).toFixed(2),
  );

  return {
    z1: [z1_0, z1_1] as [number, number],
    a1: [a1_0, a1_1] as [number, number],
    z2: [z2_0, z2_1] as [number, number],
    a2: [a2_0, a2_1] as [number, number],
    loss: lossVal,
    dOutput: [d2_0, d2_1] as [number, number],
    dActivation1: [dActivation1_0, dActivation1_1] as [number, number],
    dHidden: [dHidden_0, dHidden_1] as [number, number],
    dw1: [
      [dw1_00, dw1_01],
      [dw1_10, dw1_11],
    ] as [[number, number], [number, number]],
    db1: [db1_0, db1_1] as [number, number],
    dw2: [
      [dw2_00, dw2_01],
      [dw2_10, dw2_11],
    ] as [[number, number], [number, number]],
    db2: [db2_0, db2_1] as [number, number],
    newW1: [
      [newW1_00, newW1_01],
      [newW1_10, newW1_11],
    ] as [[number, number], [number, number]],
    newB1: [newB1_0, newB1_1] as [number, number],
    newW2: [
      [newW2_00, newW2_01],
      [newW2_10, newW2_11],
    ] as [[number, number], [number, number]],
    newB2: [newB2_0, newB2_1] as [number, number],
    newLoss: newLossVal,
  };
};

const computedStepData = computeStepData();

const {
  z1,
  a1,
  z2,
  a2,
  loss,
  dOutput,
  dActivation1,
  dHidden,
  dw1,
  db1,
  dw2,
  db2,
  newW1,
  newB1,
  newW2,
  newB2,
  newLoss,
} = computedStepData;

const BackpropFull = () => {
  const { isAboveMd } = useWindowSize();
  const [currentStep, setCurrentStep] = useState<AnimStep>("inputs");

  /* 
  Helper to clear MathJax BEFORE changing step (https://docs.mathjax.org/en/v4.0/advanced/typeset.html)
  although in this case we delete the whole typeSet so it could happen after as well.
  but that might clear newly created ones. This makes sure old ones are cleared before even changing the step. 
  */

  const changeStep = (newStep: AnimStep) => {
    if (window.MathJax?.typesetClear) {
      window.MathJax.typesetClear();
    }
    setCurrentStep(newStep);
  };

  // Cleanup MathJax on component unmount
  useEffect(() => {
    return () => {
      if (window.MathJax?.typesetClear) {
        window.MathJax.typesetClear();
      }
    };
  }, []);

  const stepData: StepData = {
    x1,
    x2,
    target,
    w1,
    b1,
    w2,
    b2,
    z1,
    a1,
    z2,
    a2,
    loss,
    dOutput,
    dActivation1,
    dHidden,
    dw1,
    db1,
    dw2,
    db2,
    newW1,
    newB1,
    newW2,
    newB2,
    newLoss,
    ReLUDerivative,
  };

  const mathContent = (step: AnimStep) => {
    const config = STEP_CONFIGS.find((conf) => conf.id === step);
    if (!config) {
      return <div>Unknown step: {step}</div>;
    }
    return config.content(stepData);
  };

  return (
    <div className="content-box mt-4 w-full">
      <h2>A teljes működés</h2>
      <div className="flex flex-col justify-center items-center gap-4">
        <BackpropVisual
          setup={{ input: [x1, x2], target: [target[0], target[1]] }}
          getStepIndex={getStepIndex}
          currentStep={currentStep}
          networkData={{ w1, b1, w2, b2 }}
          forwardPass={{ a1, z1, a2, z2 }}
          lossValues={{ loss, newLoss }}
          gradients={{ dHidden, dActivation1, dOutput, dw1, db1, dw2, db2 }}
          newNetworkData={{ newW1, newB1, newW2, newB2 }}
          stretch={!isAboveMd}
        />
        <div className="flex flex-row items-center justify-center gap-6">
          <button
            onClick={() => {
              if (currentStep !== "inputs")
                changeStep(getPreviousStep(currentStep));
            }}
            aria-label="previous state"
            className={`btn ${
              currentStep === "inputs" ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => changeStep(getNextStep(currentStep))}
            aria-label="next state"
            className="btn"
          >
            {currentStep === "weightBiasUpdate" ? (
              <RotateCcw />
            ) : (
              <ChevronRight />
            )}
          </button>
        </div>
        <div className="max-w-full mt-2 min-h-[1220px] lg:min-h-[660px]">
          {mathContent(currentStep)}
        </div>
      </div>
    </div>
  );
};

export default BackpropFull;
