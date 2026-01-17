# Objetivo de este archivo 
    Dar contexto para la modificacion de aplicacion de desc_cred por quincena

# Comportamiento actual
    el sistema implementa los descuentos en las dos quicena del mes 

# Comportamiento esperado
    la posibilidad de poder espesificar en que quincena se aplica el desc_cred

# Puntos que devemos considerar 
    * en la creacion o actualizacion de un desc_cred poner un campo con los posibles 
      datos que son
        - 1 se aplicara en la primera quincena
        - 2 se aplicara en la segunda quincena
        - 0 se aplica en ambas quicena
    
    * en el recalculo devera tomar en cuenta cuando un desc_cred debe aplicarse 

    * esto incluye los desc_cred cuotas ya que si por ejemplo un desc_cred prestamo 
        solo se descuenta en la segunda quincena pues las cuotas tendar mayor tiempo
        por que seran mensuales mientras que si se descuentas en ambas quincena 
        sera quincinal
    