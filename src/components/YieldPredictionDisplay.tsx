import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, 
  TrendingUp, 
  Droplets, 
  Thermometer, 
  Wind, 
  Leaf,
  Calendar,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Info
} from 'lucide-react';
import type { YieldPredictionOutput } from '@/services/yieldPrediction';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface YieldPredictionDisplayProps {
  prediction: YieldPredictionOutput;
  isLoading?: boolean;
}

export function YieldPredictionDisplay({ prediction, isLoading = false }: YieldPredictionDisplayProps) {
  const [isFactorsExpanded, setIsFactorsExpanded] = React.useState(false);
  const [isRecommendationsExpanded, setIsRecommendationsExpanded] = React.useState(false);

  const getFactorColor = (factor: number) => {
    if (factor >= 1.2) return 'text-green-500';
    if (factor >= 1.0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFactorIcon = (factor: number) => {
    if (factor >= 1.2) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (factor >= 1.0) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getFactorDescription = (factor: string): string => {
    const descriptions: Record<string, string> = {
      weather: "Impact of temperature and rainfall on crop yield",
      soil: "Soil quality and nutrient content effect",
      disease: "Potential impact of plant diseases",
      seasonal: "Seasonal growth patterns and timing",
      historical: "Historical yield data comparison",
      ndvi: "Normalized Difference Vegetation Index - Plant health indicator"
    };
    return descriptions[factor] || "Impact factor";
  };

  const factorsData = Object.entries(prediction.factors).map(([key, value]) => ({
    factor: key,
    value: value * 100,
    fill: value >= 1.2 ? '#22c55e' : value >= 1.0 ? '#eab308' : '#ef4444'
  }));

  const predictedYieldValue = typeof prediction.predictedYield === 'string' 
    ? parseFloat(prediction.predictedYield) 
    : prediction.predictedYield;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              Analyzing Yield Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Analyzing data...</span>
                <span className="text-sm font-medium">0%</span>
              </div>
              <Progress value={33} className="w-full">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: '33%' }}
                  />
                </div>
              </Progress>
            </div>
            <div className="h-[200px]">
              <Skeleton className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Impact Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Prediction Card */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            Yield Prediction Results
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Predicted yield based on various environmental and historical factors</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 transition-all duration-300 hover:scale-105">
              <h3 className="text-2xl font-bold">
                {prediction.predictedYield} {prediction.yieldUnit}
              </h3>
              <p className="text-sm text-muted-foreground">
                Predicted yield for your crop
              </p>
            </div>
            <div className="space-y-2 transition-all duration-300 hover:scale-105">
              <h3 className="text-2xl font-bold">
                ₹{prediction.potentialIncome.toLocaleString()}
              </h3>
              <p className="text-sm text-muted-foreground">
                Estimated potential income
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confidence Level</span>
              <span className="text-sm font-medium">{prediction.confidence}%</span>
            </div>
            <Progress value={prediction.confidence} className="w-full">
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-in-out"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </Progress>
          </div>

          {/* Add Yield Visualization */}
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ 
                name: 'Predicted Yield',
                value: predictedYieldValue,
                fill: '#3b82f6'
              }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" name={`Yield (${prediction.yieldUnit})`} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Factors Card */}
      <Collapsible open={isFactorsExpanded} onOpenChange={setIsFactorsExpanded}>
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <CardTitle className="flex items-center justify-between cursor-pointer hover:text-primary">
                Impact Factors
                <ChevronDown className={`w-4 h-4 transition-transform ${isFactorsExpanded ? 'transform rotate-180' : ''}`} />
              </CardTitle>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {/* Factors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {Object.entries(prediction.factors).map(([key, value]) => (
                  <TooltipProvider key={key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          {key === 'weather' && <Thermometer className="w-4 h-4" />}
                          {key === 'soil' && <Leaf className="w-4 h-4" />}
                          {key === 'disease' && <Droplets className="w-4 h-4" />}
                          {key === 'seasonal' && <Calendar className="w-4 h-4" />}
                          {key === 'historical' && <History className="w-4 h-4" />}
                          {key === 'ndvi' && <TrendingUp className="w-4 h-4" />}
                          <span className="capitalize">{key}</span>
                          <Badge variant="outline" className={getFactorColor(value)}>
                            {getFactorIcon(value)}
                            {(value * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getFactorDescription(key)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              
              {/* Factors Radar Chart */}
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={factorsData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Impact Score"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Recommendations Card */}
      <Collapsible open={isRecommendationsExpanded} onOpenChange={setIsRecommendationsExpanded}>
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <CardTitle className="flex items-center justify-between cursor-pointer hover:text-primary">
                Recommendations
                <ChevronDown className={`w-4 h-4 transition-transform ${isRecommendationsExpanded ? 'transform rotate-180' : ''}`} />
              </CardTitle>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <ul className="space-y-2">
                {prediction.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 animate-in slide-in-from-left">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Disease Impact Card (if applicable) */}
      {prediction.diseaseLossPercent !== null && (
        <Card className="bg-red-50 dark:bg-red-950 animate-in slide-in-from-bottom transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Disease Impact Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400">
              Expected yield loss due to disease: {prediction.diseaseLossPercent}%
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 