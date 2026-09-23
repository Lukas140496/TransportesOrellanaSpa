
export function limpiarRut(valor: string): string {
  return (valor ?? '')
    .toUpperCase()
    .replace(/[^0-9K]/g, '');
}

export function formatearRut(valor: string): string {
  const rutLimpio = limpiarRut(valor);

  if (!rutLimpio) {
    return '';
  }

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  if (!cuerpo) {
    return dv;
  }

  const cuerpoFormateado = cuerpo.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.'
  );

  return `${cuerpoFormateado}-${dv}`;
}

export function validarRut(valor: string): boolean {
  const rutLimpio = limpiarRut(valor);

  // El RUT debe tener cuerpo y dígito verificador.
  if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
    return false;
  }

  const cuerpo = rutLimpio.slice(0, -1);
  const dvIngresado = rutLimpio.slice(-1);

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;

    multiplicador =
      multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);

  let dvCalculado: string;

  if (resto === 11) {
    dvCalculado = '0';
  } else if (resto === 10) {
    dvCalculado = 'K';
  } else {
    dvCalculado = String(resto);
  }

  return dvIngresado === dvCalculado;
}