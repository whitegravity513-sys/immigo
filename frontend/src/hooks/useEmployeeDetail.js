import { useState, useEffect } from "react";
import { getEmployeeHistory, getEmployeeNote, getEmployeeLeaves } from "../services/employeeService";

export const useEmployeeDetail = (id) => {
  const [employee, setEmployee] = useState(null);
  const [note, setNote] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [noteDate, setNoteDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmployeeInfo = async () => {
    try {
      const data = await getEmployeeHistory(id);
      setEmployee(data.employee);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employee.");
    }
  };

  const fetchNote = async (dateObj) => {
    try {
      const dateStr = dateObj ? dateObj.toISOString().split('T')[0] : undefined;
      const data = await getEmployeeNote(id, dateStr);
      setNote(data);
    } catch (err) {
      setNote(null);
    }
  };

  const fetchLeaves = async () => {
    try {
      const data = await getEmployeeLeaves(id);
      setLeaves(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leaves.");
    }
  };

  useEffect(() => {
    if (!id) return;
    
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchEmployeeInfo(), fetchNote(), fetchLeaves()]);
      setLoading(false);
    };
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDateChange = (date) => {
    setNoteDate(date);
    fetchNote(date);
  };

  return {
    employee,
    note,
    leaves,
    noteDate,
    loading,
    error,
    handleDateChange
  };
};
