import type { ReactNode } from "react";
import { GoVideo } from "react-icons/go";
import { MdOutlineArticle } from "react-icons/md";
import { useWindowSize } from "../contexts/WindowSizeContext";

const resources = [
  {
    title: "MENACE - Wikipédia",
    href: "https://en.wikipedia.org/wiki/Matchbox_Educable_Noughts_and_Crosses_Engine",
    note: "A MENACE története, működése és eredményei.",
    type: "article",
  },
  {
    title: "MENACE - fórum",
    href: "https://forum.gethopscotch.com/t/menace-tic-tac-toe/61470/8",
    note: "A fórumon egy felhasználó osztja meg gondolatait a MENACE algoritmus implementációjáról. A képen látható a szimmetria kihasználásával születő összes játékállás.",
    type: "article",
  },
  {
    title: "Minimax algoritmus",
    href: "https://www.geeksforgeeks.org/artificial-intelligence/mini-max-algorithm-in-artificial-intelligence/",
    note: "A cikk a minimax algoritmus működését, optimalizációs lehetőségét és alkalmazásait ismerteti.",
    type: "article",
  },
  {
    title: "Minimax Tic-Tac-Toe implementáció",
    href: "https://www.geeksforgeeks.org/dsa/finding-optimal-move-in-tic-tac-toe-using-minimax-algorithm-in-game-theory/",
    note: "A cikk egy Tic-Tac-Toe játékhoz készült minimax algoritmus implementációt mutat be.",
    type: "article",
  },
  {
    title: "Neural networks",
    href: "https://www.geeksforgeeks.org/deep-learning/neural-networks-a-beginners-guide/",
    note: "A cikk a neurális hálózatok alapjait ismerteti.",
    type: "article",
  },
  {
    title: "Genetikus algoritmusok",
    href: "https://www.geeksforgeeks.org/dsa/genetic-algorithms/",
    note: "A cikk a genetikus algoritmusok alapjait ismerteti.",
    type: "article",
  },
  {
    title: "Genetikus algoritmus - hátizsák-probléma",
    href: "https://www.youtube.com/watch?v=MacVqujSXWE",
    note: "A videó a genetikus algoritmus működését mutatja be a hátizsák-probléma megoldásában.",
    type: "video",
  },
  {
    title: "Genetikus algoritmus - utazóügynök-probléma",
    href: "https://www.youtube.com/watch?v=Wgn_aPH3OEk",
    note: "A videó a genetikus algoritmus működését mutatja be az utazóügynök-probléma megoldásában.",
    type: "video",
  },
  {
    title: "Multilayer perceptron működése és tanítása",
    href: "https://medium.com/data-science/multilayer-perceptron-explained-a-visual-guide-with-mini-2d-dataset-0ae8100c5d1c",
    note: "A cikk egy MLP működését és tanítását ismerteti egy példán keresztül.",
    type: "article",
  },
  {
    title: "Visszaterjesztés intuitívan",
    href: "https://www.youtube.com/watch?v=Ilg3gGewQ5U&list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi&index=3",
    note: "A videó a visszaterjesztés algoritmusa mögötti intuíciót mutatja be.",
    type: "video",
  },
  {
    title: "Visszaterjesztés algoritmusa - matematika",
    href: "https://www.youtube.com/watch?v=tIeHLnjs5U8&list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi&index=4",
    note: "Az előző videó folytatása, amely részletesebben bemutatja a matematikai részeket.",
    type: "video",
  },
  {
    title: "Visszaterjesztés algoritmusa - Softmax és Cross Entropy",
    href: "https://www.youtube.com/watch?v=znqbtL0fRA0",
    note: "A videó a visszaterjesztés matematikai levezetését mutatja be, olyan aktivációs és veszteségfüggvénnyel, amit a bemutatóhoz használtam.",
    type: "video",
  },
];

const ResourcesPage = (): ReactNode => {
  const { isAboveSm } = useWindowSize();
  const size = isAboveSm ? 36 : 30;
  return (
    <div className="content-container pt-10 pb-10">
      <div className="content-box space-y-4 mt-1 mb-1 normal:mt-3 normal:mb-3">
        <h1 className="text-white">Felhasznált források</h1>
        <p>
          Ha szeretnél többet megtudni a témákról, ezek a források hasznosak
          lehetnek:
        </p>
        <ul className="space-y-3">
          {resources.map((resource) => (
            <li
              key={resource.href}
              className="rounded-md border border-slate-700 bg-slate-900/60 p-3"
            >
              <div className="flex flex-row items-center justify-between">
                <a
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resource.title}
                </a>
                <span className="text-xs text-slate-500">
                  {resource.type === "article" ? (
                    <MdOutlineArticle size={size} className="text-cyan-400" />
                  ) : (
                    <GoVideo size={size} className="text-cyan-400" />
                  )}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{resource.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ResourcesPage;
