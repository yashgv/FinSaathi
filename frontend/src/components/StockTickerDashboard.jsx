import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

const StockCard = ({
  symbol,
  name,
  lastPrice,
  change,
  changePercent,
  volume,
  dayHigh,
  dayLow,
}) => {
  const isPositive = change >= 0;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>{symbol}</span>
          <span
            className={`text-lg ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            ₹{lastPrice.toFixed(2)}
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{name}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUpIcon className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-600" />
              )}
              <span className={isPositive ? "text-green-600" : "text-red-600"}>
                ₹{Math.abs(change).toFixed(2)} (
                {Math.abs(changePercent).toFixed(2)}%)
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Volume: {volume.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm">
              H: <span className="font-medium">₹{dayHigh.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              L: <span className="font-medium">₹{dayLow.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StockTickerDashboard = () => {
  // Sample initial data - replace with your actual data
  const [stocksData, setStocksData] = useState({
    NIFTY50: {
      symbol: "NIFTY50",
      name: "Nifty 50 Index",
      lastPrice: 22000.0,
      change: 150.0,
      changePercent: 0.68,
      volume: 250000000,
      dayHigh: 22100.0,
      dayLow: 21900.0,
    },
    SENSEX: {
      symbol: "SENSEX",
      name: "BSE SENSEX",
      lastPrice: 72000.0,
      change: -200.0,
      changePercent: -0.28,
      volume: 180000000,
      dayHigh: 72200.0,
      dayLow: 71800.0,
    },
    BANKNIFTY: {
      symbol: "BANKNIFTY",
      name: "Nifty Bank Index",
      lastPrice: 46500.0,
      change: 300.0,
      changePercent: 0.65,
      volume: 120000000,
      dayHigh: 46700.0,
      dayLow: 46300.0,
    },
  });

  useEffect(() => {
    // Simulated WebSocket connection - replace with your actual WebSocket implementation
    const ws = new WebSocket("YOUR_WEBSOCKET_ENDPOINT");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStocksData((prevData) => ({
        ...prevData,
        [data.symbol]: {
          ...prevData[data.symbol],
          ...data,
        },
      }));
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {Object.values(stocksData).map((stock) => (
        <StockCard key={stock.symbol} {...stock} />
      ))}
    </div>
  );
};

export default StockTickerDashboard;
