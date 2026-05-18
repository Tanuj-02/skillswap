import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts"

const data = [
  { name: "Can Teach", value: 6 },
  { name: "Want to Learn", value: 4 },
]

const COLORS = ["#7b6cff", "#00e5b0"]

export default function SkillsChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[300px]">
      <h3 className="mb-4 font-medium">Skills Overview</h3>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}