// components/ExpenseCharts.jsx
export const ExpenseCharts = ({ expenses = [] }) => {
    // Ensure expenses is an array
    const expenseArray = Array.isArray(expenses) ? expenses : [];
    
    const monthlyExpenses = expenseArray.reduce((acc, exp) => {
      const date = new Date(exp.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      acc[monthYear] = (acc[monthYear] || 0) + exp.amount;
      return acc;
    }, {});
  
    const trendData = Object.entries(monthlyExpenses)
      .sort((a, b) => {
        const [aMonth, aYear] = a[0].split('/');
        const [bMonth, bYear] = b[0].split('/');
        return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
      })
      .map(([date, amount]) => ({
        date,
        amount
      }));
  
    const expensesByCategory = expenseArray.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
  
    const pieChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value
    }));
  
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {pieChartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </>
    );
  };