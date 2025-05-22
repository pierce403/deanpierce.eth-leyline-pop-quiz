"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
// Imports for DaimoPayButton, baseUSDC, getAddress will be removed by the model if unused after changes.
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

type Question = {
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
};

const questions: Question[] = [
  {
    question: "What does 'diversification' primarily aim to do in an investment portfolio?",
    options: [
      { key: "a", text: "Maximize risk for higher returns" },
      { key: "b", text: "Concentrate investments in a single asset" },
      { key: "c", text: "Reduce overall risk by spreading investments" },
      { key: "d", text: "Guarantee profits" },
    ],
    correctAnswer: "c",
  },
  {
    question: "What is a 'bull market' generally characterized by?",
    options: [
      { key: "a", text: "Falling stock prices and investor pessimism" },
      { key: "b", text: "Rising stock prices and investor optimism" },
      { key: "c", text: "Stagnant stock prices and investor uncertainty" },
      { key: "d", text: "High volatility with no clear direction" },
    ],
    correctAnswer: "b",
  },
  {
    question: "What does the acronym 'IPO' stand for in finance?",
    options: [
      { key: "a", text: "Internal Profit Organization" },
      { key: "b", text: "Initial Public Offering" },
      { key: "c", text: "Investment Portfolio Optimization" },
      { key: "d", text: "Immediate Payout Obligation" },
    ],
    correctAnswer: "b",
  },
];

export default function PopQuiz() {
  const { address } = useAccount();
  const [hasTaken, setHasTaken] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only set hasTaken from localStorage if a result isn't already set from current session
    if (result === null) {
      const taken = localStorage.getItem("hasTakenLeylinePopQuiz") === "true";
      setHasTaken(taken);
    }
  }, [result]); // Re-check if result changes (e.g. after retake)

  const handleOptionChange = (index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = () => {
    const allCorrect = questions.every((q, i) => answers[i] === q.correctAnswer);
    const currentResult = allCorrect ? "win" : "lose";
    setResult(currentResult);
    if (currentResult === "win") { // Or always set it if you want to record any attempt
        localStorage.setItem("hasTakenLeylinePopQuiz", "true");
        setHasTaken(true);
    }
  };

  const handlePayout = async () => {
    if (!address) return alert("Wallet address not found. Please connect your wallet to claim.");
    setLoading(true);
    try {
      const res = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toAddress: address }),
      });
      const data = await res.json();
      if (res.ok) {
        setTxHash(data.txHash);
      } else {
        alert(data.error || "Payout failed");
      }
    } catch (error) {
      let message = "An unknown error occurred during payout.";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      alert("Payout error: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeQuiz = () => {
    localStorage.removeItem("hasTakenLeylinePopQuiz");
    setHasTaken(false);
    setAnswers({});
    setResult(null);
    setTxHash("");
    // setLoading(false); // Ensure loading is reset too
  };

  // 1. Show Win Result
  if (result === "win") {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Congratulations! You Passed!</CardTitle>
          <CardDescription>
            You answered all questions correctly! Click below to receive your payout.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Button onClick={handlePayout} disabled={loading || !address}>
            {loading ? "Processing..." : "Claim $1.10 USDC"}
          </Button>
          {!address && <p className="text-sm text-red-500">Connect wallet to claim</p>}
          {txHash && (
            <p>
              Payout sent:{" "}
              <a
                href={`https://base.blockscout.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 underline"
              >
                View on block explorer
              </a>
            </p>
          )}
          <Button onClick={handleRetakeQuiz} variant="outline" className="mt-2">
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2. Show Lose Result
  if (result === "lose") {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Oops! You Failed.</CardTitle>
          <CardDescription>Sorry, some of your answers were incorrect. Please try again.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRetakeQuiz} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // 3. Show "Already Taken" if no current result but was taken in a previous session
  if (hasTaken) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Quiz Already Completed</CardTitle>
          <CardDescription>You have already completed the quiz in a previous session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRetakeQuiz} variant="outline">
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 4. Show Quiz Questions if no result and not taken before
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Leyline Pop Quiz</CardTitle>
        <CardDescription>Answer the following questions:</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="space-y-2">
            <p>{q.question}</p>
            {q.options.map((opt) => (
              <label key={opt.key} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`question-${i}`}
                  value={opt.key}
                  checked={answers[i] === opt.key}
                  onChange={() => handleOptionChange(i, opt.key)}
                />
                <span>{`${opt.key}. ${opt.text}`}</span>
              </label>
            ))}
          </div>
        ))}
        <Button onClick={handleSubmit}>Submit Answers</Button>
      </CardContent>
    </Card>
  );
}
