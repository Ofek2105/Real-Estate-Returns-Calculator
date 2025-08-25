mkdir theme, types, utils, components
mkdir components\Layout, components\Field, components\NumberInput, components\MoneyInput, components\PercentInput, components\LoanEditor, components\PropertyForm, components\ResultSummary, components\TimelineChart

ni theme\variables.css, theme\reset.css, theme\globals.css -ItemType File
ni types\finance.ts -ItemType File
ni utils\currency.ts, utils\math.ts, utils\amortization.ts -ItemType File

ni components\Layout\Layout.tsx, components\Layout\Layout.css -ItemType File
ni components\Field\Field.tsx, components\Field\Field.css -ItemType File
ni components\NumberInput\NumberInput.tsx, components\NumberInput\NumberInput.css -ItemType File
ni components\MoneyInput\MoneyInput.tsx, components\MoneyInput\MoneyInput.css -ItemType File
ni components\PercentInput\PercentInput.tsx, components\PercentInput\PercentInput.css -ItemType File
ni components\LoanEditor\LoanEditor.tsx, components\LoanEditor\LoanEditor.css -ItemType File
ni components\PropertyForm\PropertyForm.tsx, components\PropertyForm\PropertyForm.css -ItemType File
ni components\ResultSummary\ResultSummary.tsx, components\ResultSummary\ResultSummary.css -ItemType File
ni components\TimelineChart\TimelineChart.tsx, components\TimelineChart\TimelineChart.css -ItemType File
