import React from "react";
import {
  FiSearch,
  FiArrowDown,
  FiFilter,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "./controlBar.css";

type ControlBarProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  sortOption: string;
  setSortOption: React.Dispatch<React.SetStateAction<'newest' | 'oldest' | 'name'>>;
  sortOptions: { label: string; value: string }[];

  filterValue: string;
  setFilterValue: React.Dispatch<React.SetStateAction<'all' | 'approved' | 'disapproved'>>;
  filterOptions: { label: string; value: string }[];

  toggleLabel: string;
  onToggle: () => void;

  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const ControlBar: React.FC<ControlBarProps> = ({
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  sortOptions,
  filterValue,
  setFilterValue,
  filterOptions,
  toggleLabel,
  onToggle,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="cb-bar">
      {/* Search */}
      <div className="cb-group">
        <FiSearch className="cb-icon" />
        <input
          type="text"
          className="cb-input"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Sort */}
      <div className="cb-group">
        <FiArrowDown className="cb-icon" />
        <select
          className="cb-select"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as 'newest' | 'oldest' | 'name')}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter */}
      <div className="cb-group">
        <FiFilter className="cb-icon" />
        <select
          className="cb-select"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value as 'all' | 'approved' | 'disapproved')}
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle Last 5 / All */}
      <div className="cb-group">
        <FiClock className="cb-icon" />
        <button className="cb-button" onClick={onToggle}>
          {toggleLabel}
        </button>
      </div>

      {/* Pagination */}
      <div className="cb-pagination">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FiChevronLeft />
        </button>
        <span className="cb-page-label">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
