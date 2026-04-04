import { CheckCircle, Upload, X } from 'lucide-react';

const ProgressTable = () => {
  const categories = [
    {
      category: '5LPA',
      rows: [
        {
          rowTitle: 'Aptitude',
          tasks: [
            { taskName: 'Quantitative', completed: true, proofUrl: null },
            { taskName: 'Logical Reasoning', completed: false, proofUrl: null },
            {
              taskName: 'Verbal Ability',
              completed: true,
              proofUrl: 'https://example.com/proof1.png',
            },
          ],
        },
        {
          rowTitle: 'Programming',
          tasks: [
            { taskName: 'DSA - Arrays', completed: false, proofUrl: null },
            { taskName: 'DSA - Linked Lists', completed: true, proofUrl: null },
            { taskName: 'OOPS Concepts', completed: false, proofUrl: null },
          ],
        },
        {
          rowTitle: 'Core Subjects',
          tasks: [
            { taskName: 'DBMS', completed: true, proofUrl: null },
            { taskName: 'OS', completed: false, proofUrl: null },
            { taskName: 'Networks', completed: false, proofUrl: null },
          ],
        },
        {
          rowTitle: 'Communication',
          tasks: [
            { taskName: 'Resume Writing', completed: true, proofUrl: null },
            { taskName: 'Mock Interview 1', completed: false, proofUrl: null },
          ],
        },
      ],
    },
  ];

  const updateTask = (rowTitle, taskName) => {
    // TODO: api.post('/student/update-task', { rowTitle, taskName })
    console.log('Update task:', rowTitle, taskName);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
      <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-8">
        <h2 className="text-3xl font-bold text-gray-900">Progress Tracker</h2>
        <p className="mt-2 text-gray-600">Mark tasks complete and upload proofs</p>
      </div>

      <div className="overflow-x-auto">
        {categories.map((cat) => (
          <div key={cat.category} className="border-t border-gray-100">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-8 py-6 text-white">
              <h3 className="text-2xl font-bold">{cat.category} Package</h3>
            </div>
            {cat.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="border-t border-gray-100">
                <div className="border-b border-gray-100 bg-gray-50 px-8 py-4">
                  <h4 className="text-xl font-semibold text-gray-900">{row.rowTitle}</h4>
                </div>
                <div className="p-0">
                  {row.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className="flex items-center justify-between border-b border-gray-100 px-8 py-4 transition-colors last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold ${
                            task.completed
                              ? 'border-2 border-emerald-200 bg-emerald-100 text-emerald-700'
                              : 'border-2 border-gray-200 bg-gray-100 text-gray-500'
                          }`}
                        >
                          {task.completed ? '✓' : `${taskIndex + 1}`}
                        </div>
                        <span className="font-medium text-gray-900">{task.taskName}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {task.proofUrl && (
                          <a
                            href={task.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Upload className="h-5 w-5" />
                          </a>
                        )}
                        <button
                          onClick={() => updateTask(row.rowTitle, task.taskName)}
                          disabled={task.completed}
                          className={`flex items-center space-x-2 rounded-xl px-4 py-2 font-medium transition-all ${
                            task.completed
                              ? 'cursor-not-allowed bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>{task.completed ? 'Completed' : 'Mark Done'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTable;
