export function dateKey(y,m,d){
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

export function getDaysInMonth(y,m){
  return new Date(y,m+1,0).getDate();
}

export function getFirstDay(y,m){
  return new Date(y,m,1).getDay();
}
