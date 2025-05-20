// __mocks__/lucideMock.js
import React from 'react';

const createIcon = (displayName) => {
  const IconComponent = (props) => React.createElement('svg', { ...props, 'data-testid': `lucide-icon-${displayName.toLowerCase()}` });
  IconComponent.displayName = displayName;
  return IconComponent;
};

export const Users = createIcon('Users');
export const Clock = createIcon('Clock');
export const Stethoscope = createIcon('Stethoscope');
export const CheckCircle = createIcon('CheckCircle');
export const AlertTriangle = createIcon('AlertTriangle');
export const ListChecks = createIcon('ListChecks');
export const UserCheck = createIcon('UserCheck');
export const X = createIcon('X');
export const Check = createIcon('Check');
export const Loader2 = createIcon('Loader2'); // Ini akan merender <svg data-testid="lucide-icon-loader2" />

// const lucideMock = new Proxy({}, {
//   get: function(target, prop) {
//     if (typeof prop === 'string') {
//       const MockIcon = (props) => React.createElement('svg', { 'data-testid': `lucide-${prop.toLowerCase()}`, ...props });
//       MockIcon.displayName = prop;
//       return MockIcon;
//     }
//     return Reflect.get(target, prop);
//   }
// });
// module.exports = lucideMock;