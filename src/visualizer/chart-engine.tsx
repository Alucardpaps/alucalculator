import React from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ChartDataPayload {
  type: 'line' | 'bar' | 'scatter';
  data: Array<any>;
  xAxisKey?: string;
  yAxisKey?: string;
  name?: string;
}

export const ChartEngine: React.FC<{ payload: ChartDataPayload }> = ({ payload }) => {
  const { type, data, xAxisKey = 'x', yAxisKey = 'y', name = 'Value' } = payload;

  if (!data || data.length === 0) return null;

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={xAxisKey} stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
            <Legend />
            <Line type="monotone" dataKey={yAxisKey} stroke="#10b981" name={name} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
             <CartesianGrid strokeDasharray="3 3" stroke="#333" />
             <XAxis dataKey={xAxisKey} stroke="#888" />
             <YAxis stroke="#888" />
             <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
             <Legend />
             <Bar dataKey={yAxisKey} fill="#3b82f6" name={name} />
          </BarChart>
        );
      case 'scatter':
         return (
             <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" dataKey={xAxisKey} name="x" stroke="#888" />
                <YAxis type="number" dataKey={yAxisKey} name="y" stroke="#888" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                <Legend />
                <Scatter name={name} data={data} fill="#f59e0b" />
             </ScatterChart>
         );
      default:
        return <div className="text-red-400">Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className="w-full h-64 mt-4 bg-black/40 rounded-xl p-4 border border-white/10">
      <ResponsiveContainer width="100%" height="100%">
         {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
