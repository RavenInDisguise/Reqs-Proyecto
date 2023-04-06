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
# PUT
## Eliminado
- /reserva/eliminar
    parametros: 
        id: id de la reserva que se va a "eliminar"
    retorna la reserva actualizada, sirve para eliminar la reserva 

- /estudiante/eliminar  reserva/eliminar?id=2
    parametro:
        id: id del estudiante que se va a "eliminar"
    rretorna el estatus 200 si funcionó y 500 si no, sirve para eliminar un estudiante

- /cubiculo/eliminar
    parametro:
        id: id del cubiculo que se va a "eliminar"
    retorna el estatus 200 si funcionó y 500 si no, sirve para eliminar un cubiculo

## Actualizar
- /estudiante/actualizar
    parametros:
        id
        nombre
        apellido1
        apellido2
        cedula
        carnet
        fechaDeNacimiento AAAA-MM-DD
        correo
        clave
        activo ( 1/0 )
    retorna el estudiante actualizado y si no retorna 
    error al actualizar. el estatus 500 es de error y
    200 de exito

## Crear 

- /estudiante/crear
    parametros:
        nombre
        apellido1
        appelido2
        cedula
        carnet
        correo
        clave
        fechaDeNacimiento
    crea un usuario nuevo en la tabla Usuarios y luego toma el id de esta tabla para crear un Estudiante