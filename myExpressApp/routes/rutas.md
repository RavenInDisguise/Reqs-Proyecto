# GETS
- /pruebas -> hace un select * de los estudiantes esto es para pruebas
- /estudiantes 
    retorna el nombre completo del estudiante, el carne,
    la cedula y el correo de todos los estudiantes
- /estudiante  estudiante?id=2
    parametros: 
        id: id del estudiante que se busca
    retorna el nombre completo del estudiante, el carne,
    la cedula y el correo de un solo estudiante.
- /cubiculos 
    retorna todos los cubiculos con: nombre, estado, capacidad
    y una lista de servicios especiales
- /cubiculo 
    parametros:
        id: id del cubiculo del que se quiere tener la info
    retorna el id, nombre, capacidad, estado y servicios del 
    cubiculo seleccionado
- /cubiculos/disponibles
    retorn el id, nombre, capacidad, estado y servicios 
    de los cubiculos disponibles
- /reservas
    retorna el id de la reserva, el nombre del cubiculo, la capacidad, la fecha, hora de inicio y fin de la reserva
- /estudiante/reservas   estudiantes/reservas?id=2
    parametros:
        id: id del estudiante por el que filtran las reservas
    retorna el id de la reserva, el nombre del cubiculo, la capacidad, la fecha, hora de inicio y fin de la reserva de las reservas relacionadas al id del estudiante 


