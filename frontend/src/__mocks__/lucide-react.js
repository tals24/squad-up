import React from 'react';

// Mock all lucide-react icons as simple divs for testing
const mockIcon = (name) => {
  const MockedIcon = (props) => React.createElement('svg', { 
    'data-testid': `${name.toLowerCase()}-icon`, 
    ...props 
  });
  MockedIcon.displayName = name;
  return MockedIcon;
};

export const Loader2 = mockIcon('Loader2');
export const ChevronLeft = mockIcon('ChevronLeft');
export const ChevronRight = mockIcon('ChevronRight');
export const Plus = mockIcon('Plus');
export const X = mockIcon('X');
export const Check = mockIcon('Check');
export const AlertCircle = mockIcon('AlertCircle');
export const Info = mockIcon('Info');
export const Search = mockIcon('Search');
export const Filter = mockIcon('Filter');
export const Download = mockIcon('Download');
export const Upload = mockIcon('Upload');
export const Edit = mockIcon('Edit');
export const Trash = mockIcon('Trash');
export const Save = mockIcon('Save');
export const Cancel = mockIcon('Cancel');
export const ArrowLeft = mockIcon('ArrowLeft');
export const ArrowRight = mockIcon('ArrowRight');
export const Menu = mockIcon('Menu');
export const MoreVertical = mockIcon('MoreVertical');
export const Settings = mockIcon('Settings');

// Add more icons as needed
export default {};

