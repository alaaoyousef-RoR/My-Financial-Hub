import React from 'react';
import { CashFlowTable } from './CashFlowTable';
import { MonthlyRecord } from '../types/finance';

interface MonthlyTableProps {
  monthlyData?: MonthlyRecord[];
  onUpdateMonth?: (updated: MonthlyRecord) => void;
  onAddMonth?: (newMonth: MonthlyRecord) => void;
  onDeleteMonth?: (id: string) => void;
}

export const MonthlyTable: React.FC<MonthlyTableProps> = (props) => {
  return <CashFlowTable {...props} />;
};

export default MonthlyTable;
