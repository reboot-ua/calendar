"use client";

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { uk } from 'date-fns/locale';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #dadde2;
`;

const Cell = styled.div<{ $isCurrentMonth: boolean; $isToday: boolean }>`
  background: ${({ $isCurrentMonth, $isToday }) => 
    $isToday 
      ? '#e0f2fe' 
      : $isCurrentMonth 
        ? 'white' 
        : '#f9fafb'}; 
  min-height: 100px;
  padding: 8px;
  border: 1px solid ${({ $isToday }) => ($isToday ? '#3b82f6' : '#e5e7eb')};
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: ${({ $isCurrentMonth, $isToday }) => 
      $isToday 
        ? '#bae6fd' 
        : $isCurrentMonth 
          ? '#f3f4f6' 
          : '#f9fafb'};
  }
`;

const DayNumber = styled.div<{ $isToday: boolean }>`
  font-size: 0.9rem;
  color: ${({ $isToday }) => ($isToday ? '#3b82f6' : '#374151')};
  font-weight: ${({ $isToday }) => ($isToday ? 'bold' : 'normal')};
  margin-bottom: 4px;
`;

const Weekdays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const Weekday = styled.div`
  text-align: center;
  padding: 8px 0;
  font-weight: 500;
  color: #6b7280;
`;

const TasksList = styled.div`
  margin-top: 4px;
  min-height: 20px;
  position: relative;
`;

const ActionButton = styled.button`
  opacity: 0;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;

  &:hover {
    color: #ef4444;
    background: #fee2e2;
  }
`;

const TaskItem = styled.div<{ $isDragging: boolean }>`
  background: white;
  padding: 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: ${({ $isDragging }) => ($isDragging ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none')};

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;

    .delete-button {
      opacity: 1;
    }
  }
`;

const TaskText = styled.span`
  flex: 1;
  color: #374151;
  font-size: 0.9rem;
  word-break: break-word;
`;

const TaskInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-top: 8px;
  font-size: 0.9rem;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0 8px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const ClearButton = styled.button`
  padding: 6px 10px;
  background-color: #f3f4f6;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background-color: #e5e7eb;
  }
`;

const CountrySelect = styled.select`
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  background-color: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const HolidayName = styled.div`
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0 8px;
`;

const NavigationButton = styled.button`
  padding: 4px 8px;
  background-color: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.5rem;
  color: #6b7280;
  
  &:hover {
    background-color: #e5e7eb;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MonthTitle = styled.h2`
  text-align: center;
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  color: #374151;
  text-transform: capitalize;
`;

const AddTaskButton = styled.button`
  background-color: #e0e0e0;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85rem;
  cursor: pointer;
  margin-top: 8px;
  width: 100%;
  text-align: center;
  color: #374151;
  
  &:hover {
    background-color: #d0d0d0;
  }
`;

const ViewControls = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0 8px;
`;

const ViewButton = styled.button<{ $isActive: boolean }>`
  padding: 6px 12px;
  background-color: ${({ $isActive }) => ($isActive ? '#3b82f6' : '#f3f4f6')};
  color: ${({ $isActive }) => ($isActive ? 'white' : '#374151')};
  border: 1px solid ${({ $isActive }) => ($isActive ? '#3b82f6' : '#cbd5e1')};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ $isActive }) => ($isActive ? '#2563eb' : '#e5e7eb')};
  }
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #dadde2;
`;

const DayView = styled.div`
  background: #f3f4f6;
  min-height: 600px;
  padding: 1rem;
`;

const TimeSlot = styled.div`
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  min-height: 60px;
  position: relative;
`;

const TimeLabel = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  font-size: 0.8rem;
  color: #6b7280;
  padding: 0.25rem;
`;

const DropIndicator = styled.div<{ $top: number }>`
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #3b82f6;
  pointer-events: none;
  top: ${({ $top }) => $top}px;
  transition: top 0.1s ease;
`;

type ViewType = 'month' | 'week';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface Holiday {
  date: string;
  name: string;
  localName: string;
  countryCode: string;
}

interface Country {
  countryCode: string;
  name: string;
}

const getDayKey = (date: Date) => format(date, 'yyyy-MM-dd');

interface TaskItemProps {
  task: Task;
  dayKey: string;
  onEdit: (dayKey: string, taskId: string) => void;
  onSaveEdit: (dayKey: string, taskId: string) => void;
  onDelete: (dayKey: string, taskId: string) => void;
  isEditing: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string, dayKey: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
}

const TaskItemComponent: React.FC<TaskItemProps> = ({
  task,
  dayKey,
  onEdit,
  onSaveEdit,
  onDelete,
  isEditing,
  editingText,
  onEditingTextChange,
  onDragStart,
  onDragEnd,
  isDragging,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(dayKey, task.id);
    onEditingTextChange(task.text);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(dayKey, task.id);
  };

  if (isEditing) {
    return (
      <TaskItem $isDragging={isDragging}>
        <TaskInput
          autoFocus
          type="text"
          value={editingText}
          onChange={(e) => onEditingTextChange(e.target.value)}
          onBlur={() => onSaveEdit(dayKey, task.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSaveEdit(dayKey, task.id);
            } else if (e.key === 'Escape') {
              onEdit(dayKey, '');
            }
          }}
        />
      </TaskItem>
    );
  }

  return (
    <TaskItem 
      $isDragging={isDragging}
      onClick={handleClick}
      draggable
      onDragStart={(e) => onDragStart(e, task.id, dayKey)}
      onDragEnd={onDragEnd}
    >
      <TaskText>{task.text}</TaskText>
      <DeleteButton 
        className="delete-button"
        onClick={handleDelete}
        title="Видалити задачу"
      >
        🗑️
      </DeleteButton>
    </TaskItem>
  );
};

const DeleteButton = styled.button`
  opacity: 0;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;

  &:hover {
    color: #ef4444;
    background: #fee2e2;
  }
`;

const CalendarGrid: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const [tasks, setTasks] = useState<{ [key: string]: Task[] }>(() => {
    const savedTasks = localStorage.getItem('calendarTasks');
    return savedTasks ? JSON.parse(savedTasks) : {};
  });

  const [editing, setEditing] = useState<{ dayKey: string; taskId: string } | null>(null);
  const [editingText, setEditingText] = useState('');
  const [newTask, setNewTask] = useState<{ [key: string]: string }>({});
  const [showTaskInputForDay, setShowTaskInputForDay] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('UA');
  const [holidays, setHolidays] = useState<{ [key: string]: Holiday[] }>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [dropIndicatorPosition, setDropIndicatorPosition] = useState<number | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<{ dayKey: string; element: HTMLElement } | null>(null);

  useEffect(() => {
    localStorage.setItem('calendarTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
        const data: Country[] = await response.json();
        setCountries(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = monthStart.getFullYear();
        const response = await fetch(
          `/api/holidays?year=${year}&country=${selectedCountry}`
        );
        const data: Holiday[] = await response.json();
        
        const holidaysMap = data.reduce((acc, holiday) => {
          if (!acc[holiday.date]) {
            acc[holiday.date] = [];
          }
          acc[holiday.date].push(holiday);
          return acc;
        }, {} as Record<string, Holiday[]>);
        
        setHolidays(holidaysMap);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };

    fetchHolidays();
  }, [monthStart, selectedCountry]);

  const handlePrevPeriod = () => {
    switch (viewType) {
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => subMonths(prev, 1/4));
        break;
    }
  };

  const handleNextPeriod = () => {
    switch (viewType) {
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addMonths(prev, 1/4));
        break;
    }
  };

  const handleAddTask = (dayKey: string) => {
    const taskText = newTask[dayKey]?.trim();
    if (!taskText) return;

    const newTaskItem: Task = {
      id: Date.now().toString(),
      text: taskText,
      completed: false,
    };

    setTasks(prev => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), newTaskItem],
    }));

    setNewTask(prev => ({ ...prev, [dayKey]: '' }));
  };

  const handleEditTask = (dayKey: string, taskId: string) => {
    const task = tasks[dayKey]?.find(t => t.id === taskId);
    if (task) {
      setEditing({ dayKey, taskId });
      setEditingText(task.text);
    }
  };

  const handleSaveEdit = (dayKey: string, taskId: string) => {
    if (!editing) return;

    const { dayKey: editingDayKey, taskId: editingTaskId } = editing;
    const taskText = editingText.trim();
    if (!taskText) return;

    setTasks(prev => ({
      ...prev,
      [editingDayKey]: prev[editingDayKey].map(task =>
        task.id === editingTaskId ? { ...task, text: taskText } : task
      ),
    }));

    setEditing(null);
    setEditingText('');
  };

  const handleDeleteTask = (dayKey: string, taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [dayKey]: prev[dayKey].filter(task => task.id !== taskId),
    }));
  };

  const handleDragStart = (e: React.DragEvent, taskId: string, dayKey: string) => {
    e.dataTransfer.setData('text/plain', dayKey);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
    (e.target as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDropIndicatorPosition(null);
    setDraggedTaskId(null);
    setDragTarget(null);
    (e.target as HTMLElement).classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dayKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const cell = e.currentTarget;
    const tasksList = cell.querySelector('[data-tasks-list]');
    if (!tasksList) return;

    setDragTarget({ dayKey, element: cell });

    const rect = tasksList.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setDropIndicatorPosition(y);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropIndicatorPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDayKey: string) => {
    e.preventDefault();
    setDropIndicatorPosition(null);
    
    const sourceDayKey = e.dataTransfer.getData('text/plain');
    const taskId = e.dataTransfer.getData('taskId');
    
    if (!taskId || !dragTarget) return;

    setTasks(prev => {
      const sourceTasks = prev[sourceDayKey] || [];
      const targetTasks = prev[targetDayKey] || [];
      const taskToMove = sourceTasks.find(t => t.id === taskId);
      
      if (!taskToMove) return prev;

      if (sourceDayKey === targetDayKey) {
        // Reorder within the same day
        const tasksList = dragTarget.element.querySelector('[data-tasks-list]');
        if (!tasksList) return prev;

        const rect = tasksList.getBoundingClientRect();
        const dropY = e.clientY - rect.top;
        const taskElements = Array.from(tasksList.querySelectorAll('[data-task-item]'));
        let insertIndex = 0;

        taskElements.forEach((element, index) => {
          const elementRect = element.getBoundingClientRect();
          const elementCenter = elementRect.top + elementRect.height / 2 - rect.top;
          if (dropY > elementCenter) {
            insertIndex = index + 1;
          }
        });

        const newTasks = [...sourceTasks];
        const taskIndex = newTasks.findIndex(t => t.id === taskId);
        newTasks.splice(taskIndex, 1);
        newTasks.splice(insertIndex, 0, taskToMove);

        return {
          ...prev,
          [targetDayKey]: newTasks,
        };
      } else {
        // Move to a different day
        return {
          ...prev,
          [sourceDayKey]: sourceTasks.filter(t => t.id !== taskId),
          [targetDayKey]: [...targetTasks, taskToMove],
        };
      }
    });

    setDragTarget(null);
  };

  const filteredTasks = (dayTasks: Task[]) => {
    if (!searchQuery.trim()) return dayTasks;
    return dayTasks.filter(task => 
      task.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const handleCellClick = (dayKey: string) => {
    setShowTaskInputForDay(dayKey);
    setNewTask((prev) => ({ ...prev, [dayKey]: "" }));
  };

  const renderMonthView = () => {
    const days: JSX.Element[] = [];
    let day = startDate;

    while (day <= endDate) {
      const dayKey = getDayKey(day);
      const isCurrent = isSameMonth(day, monthStart);
      const dayTasks = tasks[dayKey] || [];
      const filteredDayTasks = filteredTasks(dayTasks);
      const dayHolidays = holidays[dayKey] || [];

      days.push(
        <Cell
          key={dayKey}
          $isCurrentMonth={isCurrent}
          $isToday={isToday(day)}
          onDragOver={(e) => handleDragOver(e, dayKey)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, dayKey)}
          onClick={() => handleCellClick(dayKey)}
        >
          <DayNumber $isToday={isToday(day)}>{format(day, 'd')}</DayNumber>
          {dayHolidays.map((holiday, index) => (
            <HolidayName 
              key={`${holiday.date}-${index}`}
              title={`${holiday.localName} (${holiday.countryCode})`}
            >
              {holiday.localName}
            </HolidayName>
          ))}
          <TasksList data-tasks-list>
            {dropIndicatorPosition !== null && dragTarget?.dayKey === dayKey && (
              <DropIndicator $top={dropIndicatorPosition} />
            )}
            {filteredDayTasks.map((task) => (
              <TaskItemComponent
                key={task.id}
                task={task}
                dayKey={dayKey}
                onEdit={handleEditTask}
                onSaveEdit={(dayKey, taskId) => handleSaveEdit(dayKey, taskId)}
                onDelete={handleDeleteTask}
                isEditing={editing?.dayKey === dayKey && editing?.taskId === task.id}
                editingText={editingText}
                onEditingTextChange={setEditingText}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggedTaskId === task.id}
              />
            ))}
          </TasksList>
          {showTaskInputForDay === dayKey && (
            <TaskInput
              autoFocus
              type="text"
              placeholder="Нова задача..."
              value={newTask[dayKey] || ""}
              onChange={(e) => setNewTask((prev) => ({ ...prev, [dayKey]: e.target.value }))}
              onBlur={() => {
                if (newTask[dayKey]?.trim()) {
                  handleAddTask(dayKey);
                }
                setShowTaskInputForDay(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTask[dayKey]?.trim()) {
                  handleAddTask(dayKey);
                  setShowTaskInputForDay(null);
                } else if (e.key === 'Escape') {
                  setShowTaskInputForDay(null);
                }
              }}
            />
          )}
        </Cell>
      );
      day = addDays(day, 1);
    }

    return <Grid>{days}</Grid>;
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days: JSX.Element[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayKey = getDayKey(day);
      const dayTasks = tasks[dayKey] || [];
      const filteredDayTasks = filteredTasks(dayTasks);
      const dayHolidays = holidays[dayKey] || [];

      days.push(
        <Cell
          key={dayKey}
          $isCurrentMonth={true}
          $isToday={isToday(day)}
          onDragOver={(e) => handleDragOver(e, dayKey)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, dayKey)}
          onClick={() => handleCellClick(dayKey)}
        >
          <DayNumber $isToday={isToday(day)}>{format(day, 'd')}</DayNumber>
          {dayHolidays.map((holiday, index) => (
            <HolidayName 
              key={`${holiday.date}-${index}`}
              title={`${holiday.localName} (${holiday.countryCode})`}
            >
              {holiday.localName}
            </HolidayName>
          ))}
          <TasksList data-tasks-list>
            {dropIndicatorPosition !== null && dragTarget?.dayKey === dayKey && (
              <DropIndicator $top={dropIndicatorPosition} />
            )}
            {filteredDayTasks.map((task) => (
              <TaskItemComponent
                key={task.id}
                task={task}
                dayKey={dayKey}
                onEdit={handleEditTask}
                onSaveEdit={(dayKey, taskId) => handleSaveEdit(dayKey, taskId)}
                onDelete={handleDeleteTask}
                isEditing={editing?.dayKey === dayKey && editing?.taskId === task.id}
                editingText={editingText}
                onEditingTextChange={setEditingText}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggedTaskId === task.id}
              />
            ))}
          </TasksList>
          {showTaskInputForDay === dayKey && (
            <TaskInput
              autoFocus
              type="text"
              placeholder="Нова задача..."
              value={newTask[dayKey] || ""}
              onChange={(e) => setNewTask((prev) => ({ ...prev, [dayKey]: e.target.value }))}
              onBlur={() => {
                if (newTask[dayKey]?.trim()) {
                  handleAddTask(dayKey);
                }
                setShowTaskInputForDay(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTask[dayKey]?.trim()) {
                  handleAddTask(dayKey);
                  setShowTaskInputForDay(null);
                } else if (e.key === 'Escape') {
                  setShowTaskInputForDay(null);
                }
              }}
            />
          )}
        </Cell>
      );
    }

    return <WeekGrid>{days}</WeekGrid>;
  };

  const renderView = () => {
    switch (viewType) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      default:
        return renderMonthView();
    }
  };

  const getViewTitle = () => {
    switch (viewType) {
      case 'month':
        return `${format(monthStart, 'LLLL', { locale: uk })} ${monthStart.getFullYear()}`;
      case 'week':
        return `Тиждень ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMMM', { locale: uk })}`;
      default:
        return '';
    }
  };

  const weekdayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  return (
    <div style={{ padding: '1rem', maxWidth: '960px', margin: '0 auto' }}>
      <NavigationContainer>
        <NavigationButton onClick={handlePrevPeriod}>
          ‹
        </NavigationButton>
        <MonthTitle>{getViewTitle()}</MonthTitle>
        <NavigationButton onClick={handleNextPeriod}>
          ›
        </NavigationButton>
      </NavigationContainer>
      <ViewControls>
        <ViewButton
          $isActive={viewType === 'month'}
          onClick={() => setViewType('month')}
        >
          Місяць
        </ViewButton>
        <ViewButton
          $isActive={viewType === 'week'}
          onClick={() => setViewType('week')}
        >
          Тиждень
        </ViewButton>
      </ViewControls>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Пошук завдань..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <ClearButton onClick={() => setSearchQuery("")}>
            Очистити
          </ClearButton>
        )}
      </SearchContainer>
      <SearchContainer>
        <CountrySelect
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          {countries.map((country) => (
            <option key={country.countryCode} value={country.countryCode}>
              {country.name}
            </option>
          ))}
        </CountrySelect>
      </SearchContainer>
      <Weekdays>
        {weekdayNames.map((name) => (
          <Weekday key={name}>{name}</Weekday>
        ))}
      </Weekdays>
      {renderView()}
    </div>
  );
};

export default CalendarGrid; 