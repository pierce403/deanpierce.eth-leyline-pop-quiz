"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { DaimoPayButton } from "@daimo/pay";
import { baseUSDC } from "@daimo/contract";
import { getAddress } from "viem";
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
    question: "What is the primary purpose of diversification?",
    options: [
      { key: "a", text: "Maximize risk" },
      { key: "b", text: "Reduce risk" },
      { key: "c", text: "Increase fees" },
      { key: "d", text: "Eliminate returns" },
    ],
    correctAnswer: "b",
  },
  {
    question: "What is a bull market?",
    options: [
      { key: "a", text: "Prices rising" },
      { key: "b", text: "Prices falling" },
      { key: "c", text: "Stable prices" },
      { key: "d", text: "No trading" },
    ],
    correctAnswer: "a",
  },
  {
    question: "What does ROI stand for?",
    options: [
      { key: "a", text: "Return on Investment" },
      { key: "b", text: "Rate of Inflation" },
      { key: "c", text: "Ratio of Income" },
      { key: "d", text: "Revenue over Interest" },
    ],
    correctAnswer: "a",
  },
];

export default function PopQuiz() {
  const { address } = useAccount();
  const [hasTaken, setHasTaken] = useState(false);
  const [paid, setPaid] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const taken = localStorage.getItem("hasTakenLeylinePopQuiz") === "true";
    setHasTaken(taken);
  }, []);

  const handlePaymentCompleted = () => {
    setPaid(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = () => {
    const allCorrect = questions.every((q, i) => answers[i] === q.correctAnswer);
    setResult(allCorrect ? "win" : "lose");
    localStorage.setItem("hasTakenLeylinePopQuiz", "true");
  };

  const handlePayout = async () => {
    if (!address) return alert("Wallet address not found");
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
      alert("Payout error: " + error);
    } finally {
      setLoading(false);
    }
  };

  if (hasTaken) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Quiz Completed</CardTitle>
          <CardDescription>You have already taken the quiz.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!paid) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Pay to Play</CardTitle>
          <CardDescription>Pay $1 using USDC on Base to start the quiz</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <DaimoPayButton
            appId={process.env.NEXT_PUBLIC_DAIMO_PAY_KEY || "pay-demo"}
            toChain={baseUSDC.chainId}
            toUnits="1.00"
            toToken={getAddress(baseUSDC.token)}
            onPaymentStarted={() => {}}
            onPaymentCompleted={handlePaymentCompleted}
          />
        </CardContent>
      </Card>
    );
  }

  if (result === null) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Quiz Questions</CardTitle>
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

  if (result === "lose") {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Quiz Result</CardTitle>
          <CardDescription>Sorry, some answers were incorrect.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Congratulations!</CardTitle>
        <CardDescription>
          You answered correctly! Click below to receive your payout.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Button onClick={handlePayout} disabled={loading}>
          {loading ? "Processing..." : "Claim $1.10 USDC"}
        </Button>
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
      </CardContent>
    </Card>
  );
}
