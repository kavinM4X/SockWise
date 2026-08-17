export function daysAgo(n) { 
  const d = new Date(); 
  d.setDate(d.getDate() - n); 
  return d; 
}

export function isToday(d) { 
  const t = new Date(); 
  return new Date(d).toDateString() === t.toDateString(); 
}

export function fmt(n) { 
  return '₹' + Math.round(n).toLocaleString('en-IN'); 
}
