import { useEffect, useState, type ReactNode } from "react";
import { MathJaxContext } from "better-react-mathjax";
import RandomContent from "../components/learn/random/RandomContent";
import MenaceContent from "../components/learn/menace/MenaceContent";
import MinimaxContent from "../components/learn/minimax/MinimaxContent";
import NeuralNetworkContent from "../components/learn/neuralnetwork/NeuralNetworkContent";
import GeneticContent from "../components/learn/genetic/GeneticContent";
import BackpropagationContent from "../components/learn/backprop/BackpropagationContent";
import LearnMenu from "../components/learn/LearnMenu";
import SmallScreen from "./SmallScreen";

// MathJax configuration
const mathJaxConfig = {
  options: {
    enableMenu: false,
  },
};

const topics = {
  Random: "Random",
  Menace: "Menace",
  Minimax: "Minimax",
  NeuralNetwork: "Neuronháló",
  Evolution: "Genetikus algoritmus",
  Backpropagation: "Visszaterjesztés",
};

/**
 * Generates the content component based on the selected topic.
 * @param topic - The selected topic.
 * @returns The rendered content component for the selected topic.
 */
const contentGenerator = (topic: string): ReactNode => {
  switch (topic) {
    case "Random":
      return <RandomContent key="random" />;
    case "Menace":
      return <MenaceContent key="menace" />;
    case "Minimax":
      return <MinimaxContent key="minimax" />;
    case "Neuronháló":
      return <NeuralNetworkContent key="neural" />;
    case "Genetikus algoritmus":
      return <GeneticContent key="genetic" />;
    case "Visszaterjesztés":
      return <BackpropagationContent key="backprop" />;
    default:
      return <SmallScreen bg={false} text={"Ez a tartalom nem létezik."} />;
  }
};

/**
 * Component for displaying educational content on various topics.
 *
 * Switches content based on the selected topic from the menu.
 *
 * @returns The rendered LearnPage component.
 */
const LearnPage = (): ReactNode => {
  const [activeTopic, setActiveTopic] = useState<string>("Random");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleTopicChange = (newTopic: string) => {
    setActiveTopic(newTopic);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTopic]);

  return (
    <MathJaxContext config={mathJaxConfig}>
      <>
        <LearnMenu
          activeTopic={activeTopic}
          handleTopicChange={handleTopicChange}
          topics={topics}
        />
        <div inert={isMenuOpen ? true : undefined}>
          {contentGenerator(activeTopic)}
        </div>
      </>
    </MathJaxContext>
  );
};

export default LearnPage;
