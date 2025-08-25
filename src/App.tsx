import React from 'react';
import PaymentPlanTable from './components/PaymentPlanTable/PaymentPlanTable';
import PurchaseOpsSimple from './components/PurchaseOpsSimple/PurchaseOpsSimple';
import ToastProvider from './components/ToastProvider/ToastProvider';
import ResultsChart from './components/ResultsChart/ResultsChart';
import Header from './components/Header/Header';
import { computeFullPrice } from './utils/math';

import type { PaymentTableState, Row } from './types/finance';
import './app.css';

function uuid() { return Math.random().toString(36).slice(2); }

const initialRows: Row[] = [
  { id: uuid(), label: 'Apartment', kind: 'amount', builtin: 'apartment', amount100: 100000 },
  { id: uuid(), label: 'Parking', kind: 'amount', builtin: 'parking', amount100: 10000 },
  { id: uuid(), label: 'TAX', kind: 'computed', builtin: 'tax', isLocked: true },
  { id: uuid(), label: 'Full Price', kind: 'computed', builtin: 'full_price', isLocked: true },
  { id: uuid(), label: '—', kind: 'separator' },
  { id: uuid(), label: 'Furniture', kind: 'amount', builtin: 'furniture', amount100: 0 },
  { id: uuid(), label: 'Notary', kind: 'computed', builtin: 'notary', isLocked: true },
  { id: uuid(), label: 'Appraiser', kind: 'computed', builtin: 'appraiser', isLocked: true },
  { id: uuid(), label: 'Total', kind: 'computed', builtin: 'total', isLocked: true },
];

const initialState: PaymentTableState = {
  currency: 'EUR',
  stages: [
    { id: uuid(), label: 'Stage 1', date: new Date().toISOString().slice(0, 10), percent: 30 },
    { id: uuid(), label: 'Stage 2', date: new Date().toISOString().slice(0, 10), percent: 70 },
  ],
  taxPercent: 9,
  notaryPercent: 0,
  appraiserPercent: 0,
  rows: initialRows,
};

export default function App() {
  const [state, setState] = React.useState<PaymentTableState>(initialState);
  const [investmentCost, setInvestmentCost] = React.useState<number | null>(null);
  const [monthlyRent, setMonthlyRent] = React.useState<number>(0);

  const [propAppPctYear, setPropAppPctYear] = React.useState(0);
  const [opExPctOfRent, setOpExPctOfRent] = React.useState(0);
  const [rentAppPctYear, setRentAppPctYear] = React.useState(0);

  const [horizonMonths, setHorizonMonths] = React.useState(120); // ⬅️ NEW

  const fullPriceNow = computeFullPrice(state);


  return (
    <ToastProvider>
      <Header />

      <div className="container">
        <h2>Payment Stages</h2>
        <PaymentPlanTable
          state={state}
          onChange={setState}
          onInvestmentCost={setInvestmentCost}
        />
        <PurchaseOpsSimple
          investmentCost={investmentCost}
          currency={state.currency}
          monthlyRent={monthlyRent}
          onMonthlyRentChange={setMonthlyRent}

          propAppreciationPctYear={propAppPctYear}
          onPropAppreciationChange={setPropAppPctYear}

          opExPctOfRent={opExPctOfRent}
          onOpExChange={setOpExPctOfRent}

          rentAppreciationPctYear={rentAppPctYear}
          onRentAppreciationChange={setRentAppPctYear}
        />
        <div style={{ margin: "2rem 0" }} />
        <ResultsChart
          currency={state.currency}
          fullPriceNow={fullPriceNow}
          investmentCost={investmentCost}
          monthlyRent={monthlyRent}
          propAppreciationPctYear={propAppPctYear}
          rentAppreciationPctYear={rentAppPctYear}
          opExPctOfRent={opExPctOfRent}             // ⬅️ pass value
          onHorizonMonthsChange={setHorizonMonths}     // ⬅️ pass setter
          horizonMonths={horizonMonths}
        />

      </div>
    </ToastProvider>
  );
}
