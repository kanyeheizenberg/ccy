 import React, { useState, useEffect } from 'react';

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const get7DayRange = () => {
  const today = getToday();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date;
  });
};

const fetchWeather = async (date, setWeatherInfo) => {
  const lat = 25.7617; // example: Miami
  const lon = -80.1918;
  const isoDate = date.toISOString().split('T')[0];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${isoDate}&end_date=${isoDate}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const forecast = {
      max: data.daily.temperature_2m_max[0],
      min: data.daily.temperature_2m_min[0],
      code: data.daily.weathercode[0],
    };
    setWeatherInfo({
      max: Math.round((forecast.max * 9) / 5 + 32),
      min: Math.round((forecast.min * 9) / 5 + 32),
      code: forecast.code,
    });
  } catch (err) {
    setWeatherInfo({ error: 'Weather unavailable' });
  }
};

const App = () => {
  const fonts = ['Orbitron, sans-serif', 'Audiowide, sans-serif', 'Share Tech Mono, monospace', 'Exo, sans-serif'];
  const [fontIndex, setFontIndex] = useState(0);
  const dynamicFont = fonts[fontIndex % fonts.length];

  useEffect(() => {
    const interval = setInterval(() => {
      setFontIndex((prev) => (prev + 1) % fonts.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  const [tabs, setTabs] = useState(() => JSON.parse(localStorage.getItem('tabs')) || []);
  const [activeTab, setActiveTab] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('tabs')) || [];
    return stored.length ? stored[0].id : '';
  });
  const [dates, setDates] = useState(get7DayRange);
  const [taskInput, setTaskInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getToday().toISOString());
  const [selectedTime, setSelectedTime] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [tabToDelete, setTabToDelete] = useState(null);
  const [activeDayView, setActiveDayView] = useState(null);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [hoveredTabId, setHoveredTabId] = useState(null);

  useEffect(() => {
    localStorage.setItem('tabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeout = setTimeout(() => setDates(get7DayRange()), midnight - now);
    return () => clearTimeout(timeout);
  }, [dates]);

  useEffect(() => {
    if (activeDayView) {
      const dateObj = new Date(activeDayView);
      fetchWeather(dateObj, setWeatherInfo);
    }
  }, [activeDayView]);

  const createTab = () => {
    const newTab = {
      id: Date.now().toString(),
      name: `Tab ${tabs.length + 1}`,
      tasks: [],
    };
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setActiveTab(newTab.id);
  };

  const confirmDeleteTab = (tabId) => {
    setTabToDelete(tabId);
    setShowConfirm(true);
  };

  const deleteTab = () => {
    const newTabs = tabs.filter(tab => tab.id !== tabToDelete);
    setTabs(newTabs);
    if (tabToDelete === activeTab) {
      setActiveTab(newTabs.length ? newTabs[0].id : '');
    }
    setShowConfirm(false);
    setTabToDelete(null);
  };

  const addTask = () => {
    if (!taskInput.trim()) return;
    const newTabs = tabs.map(tab =>
      tab.id === activeTab
        ? {
            ...tab,
            tasks: [
              ...tab.tasks,
              {
                id: Date.now().toString(),
                text: taskInput.trim(),
                note: noteInput.trim(),
                date: selectedDate,
                time: selectedTime,
                completed: false,
              },
            ],
          }
        : tab
    );
    setTabs(newTabs);
    setTaskInput('');
    setNoteInput('');
    setSelectedTime('');
  };

  const toggleComplete = (taskId) => {
    const newTabs = tabs.map(tab =>
      tab.id === activeTab
        ? {
            ...tab,
            tasks: tab.tasks.map(task =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            ),
          }
        : tab
    );
    setTabs(newTabs);
  };

  const clearCompleted = () => {
    if (!window.confirm("Are you sure you want to clear all completed tasks?")) return;
    const newTabs = tabs.map(tab =>
      tab.id === activeTab
        ? { ...tab, tasks: tab.tasks.filter(task => !task.completed) }
        : tab
    );
    setTabs(newTabs);
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const sortedTasks = (currentTab?.tasks || []).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
    const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
    return dateA - dateB;
  });

  const dayTasks = (dateStr) => (currentTab?.tasks || []).filter(task => task.date.slice(0, 10) === dateStr);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2vw', maxWidth: '90vw', margin: '0 auto', background: '#111', color: '#f0f0f0', borderRadius: '2vw', boxShadow: '0 2px 12px rgba(255,255,255,0.1)' }}>
      <h1 style={{
        textAlign: 'center',
        color: '#00ffff',
        fontSize: '2.2rem',
        marginBottom: '1.5rem',
        fontFamily: dynamicFont,
        animation: 'glow 3s ease-in-out infinite',
        textShadow: '0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff'
      }}>
        Christian Yeagley's Super Calendar
      </h1>
      <style>
        {`@keyframes glow {
          0% { text-shadow: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff; }
          50% { text-shadow: 0 0 20px #0ff, 0 0 30px #0ff, 0 0 40px #0ff; }
          100% { text-shadow: 0 0 5px #0ff, 0 0 10px #0ff, 0 0 20px #0ff; }
        }`}
      </style>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onMouseEnter={() => setHoveredTabId(tab.id)}
            onMouseLeave={() => setHoveredTabId(null)}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="text"
              value={tab.name}
              onChange={e => {
                const newName = e.target.value;
                setTabs(tabs.map(t => t.id === tab.id ? { ...t, name: newName } : t));
              }}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '6px 8px', borderRadius: '10px', border: '1px solid #00ffff', background: tab.id === activeTab ? '#111' : '#000', color: '#0ff', boxShadow: tab.id === activeTab ? '0 0 8px #00ffff' : 'none', fontWeight: 'bold' }}
            />
            {hoveredTabId === tab.id && (
              <span
                onClick={() => confirmDeleteTab(tab.id)}
                style={{ position: 'absolute', top: '-4px', left: '-4px', background: '#00ffff', borderRadius: '50%', color: 'white', width: 16, height: 16, fontSize: 12, textAlign: 'center', cursor: 'pointer', lineHeight: '16px' }}
              >×</span>
            )}
          </div>
        ))}
        <button onClick={createTab} style={{ padding: '8px 12px', borderRadius: 6 }}>+ Add Tab</button>
      </div>

      {showConfirm && (
        <div style={{ background: '#222', padding: 20, borderRadius: 12, boxShadow: '0 2px 6px rgba(0,255,255,0.2)', color: '#f88', textAlign: 'center' }}>
          <p>Are you sure you want to delete this tab?</p>
          <button onClick={deleteTab} style={{ marginRight: 8 }}>Delete</button>
          <button onClick={() => setShowConfirm(false)}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        {dates.map(date => {
          const iso = date.toISOString();
          return (
            <div key={iso} onClick={() => setActiveDayView(iso)} style={{ padding: 10, minWidth: 120, textAlign: 'center', border: '1px solid #555', borderRadius: 10, cursor: 'pointer', background: activeDayView === iso ? '#00ffff33' : '#222', boxShadow: '0 0 10px rgba(0,255,255,0.2)', color: '#fff', transition: 'all 0.2s ease-in-out' }}>
              {date.toDateString()} {date.toDateString() === getToday().toDateString() && '(today)'}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, background: '#1a1a1a', padding: '12px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,255,255,0.2)' }}>
  <input value={taskInput} onChange={e => setTaskInput(e.target.value)} placeholder="New Task" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #00ffff', background: '#000', color: '#0ff', outline: 'none', transition: '0.2s', boxShadow: '0 0 5px #00ffff55' }} />
  <input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Note" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #00ffff', background: '#000', color: '#0ff' }} />
  <div style={{ position: 'relative' }}>
  <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} style={{ padding: '10px 32px 10px 10px', borderRadius: '8px', border: '1px solid #00ffff', background: '#000', color: '#0ff', outline: 'none', transition: '0.2s', boxShadow: '0 0 5px #00ffff55', appearance: 'none' }} />
  <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 7V12L15 14" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="#00ffff" strokeWidth="2"/>
  </svg>
</div>
  <button onClick={addTask} style={{ background: '#00ffff', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: '0 0 10px #0ff' }}>Add</button>
      </div>

      <h3>Tasks</h3>
      {sortedTasks.filter(t => !t.completed).map(task => (
        <div key={task.id} style={{ background: '#222', padding: 10, borderRadius: 6, marginBottom: 6, boxShadow: '0 1px 3px rgba(255,255,255,0.05)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id)} />
            <div>
              <strong>{task.text}</strong> <br />
              <small>{task.date.slice(0,10)} {task.time && `at ${task.time}`}</small>
              <div style={{ fontSize: 12 }}>{task.note}</div>
            </div>
          </label>
        </div>
      ))}

      <h3>Completed <button onClick={clearCompleted}>Clear</button></h3>
      {sortedTasks.filter(t => t.completed).map(task => (
        <div key={task.id} style={{ background: '#333', padding: 10, borderRadius: 6, marginBottom: 6, borderTop: '1px solid #555' }}>
          <strong>{task.text}</strong> <br />
          <small>{task.date.slice(0,10)} {task.time && `at ${task.time}`}</small>
          <div style={{ fontSize: 12 }}>{task.note}</div>
        </div>
      ))}

      {activeDayView && (
        <div style={{ marginTop: 20, background: '#111', color: '#0ff', borderRadius: 16, padding: 24, boxShadow: '0 0 15px rgba(0,255,255,0.3)', border: '1px solid #00ffff' }}>
          <h3>Details for {new Date(activeDayView).toDateString()}</h3>
          {weatherInfo ? (
            weatherInfo.error ? (
              <p style={{ color: 'red' }}>{weatherInfo.error}</p>
            ) : (
              <p>High: {weatherInfo.max}°F &nbsp; Low: {weatherInfo.min}°F</p>
            )
          ) : (
            <p>Loading weather...</p>
          )}
          <div>
            {(dayTasks(activeDayView.slice(0, 10)) || []).map(task => (
              <div key={task.id} style={{ padding: 10, background: '#1a1a1a', borderRadius: 8, marginBottom: 8, color: '#f0f0f0' }}>
                <strong>{task.text}</strong> at {task.time || 'unspecified'}
                <div style={{ fontSize: 12, color: '#666' }}>{task.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
