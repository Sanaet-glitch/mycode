import { BarChart, BarChartHorizontal, LineChart, PieChart } from "lucide-react";

interface ChartPlaceholderProps {
  type: 'bar' | 'barHorizontal' | 'pie' | 'line';
  height?: number;
}

/**
 * A placeholder component for charts
 * In a real application, this would be replaced with actual chart components
 * from a library like Recharts, Chart.js, or D3
 */
export const ChartPlaceholder = ({ type, height = 300 }: ChartPlaceholderProps) => {
  return (
    <div 
      className="w-full bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center" 
      style={{ height: `${height}px` }}
    >
      <div className="text-center">
        <div className="mb-2">
          {type === 'bar' && <BarChart className="h-10 w-10 mx-auto text-gray-400" />}
          {type === 'barHorizontal' && <BarChartHorizontal className="h-10 w-10 mx-auto text-gray-400" />}
          {type === 'pie' && <PieChart className="h-10 w-10 mx-auto text-gray-400" />}
          {type === 'line' && <LineChart className="h-10 w-10 mx-auto text-gray-400" />}
        </div>
        <p className="text-sm text-gray-500">
          {type.charAt(0).toUpperCase() + type.slice(1)} Chart Placeholder
        </p>
        <p className="text-xs text-gray-400">
          (In a real app, this would be an actual chart)
        </p>
      </div>
    </div>
  );
};

export default ChartPlaceholder; 