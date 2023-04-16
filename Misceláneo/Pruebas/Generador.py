from random import randint
from unidecode import unidecode
from datetime import datetime, timedelta
import bcrypt

# HASHING
salt = bcrypt.gensalt(rounds=10)

# OUTPUT
OUTPUT_FILE = 'Data.sql'
PASS_FILE = 'Claves.txt'

# ENTRIES PER TABLE
NUM_ADMIN       = 10
NUM_STUDENTS    = 200
NUM_ROOMS       = 30
NUM_RESERV      = 500

# USER TYPES
USER_TYPES = ['Administrador', 'Estudiante']

# SERVICES
SPECIAL_SERVICES = ['NVDA', 'Lanbda 1.4', 'JAWS', 'Teclado especial', 'Línea braille', 'Impresora Fuse', 'Préstamo']
ROOM_STATUS = ['Habilitado', 'Ocupado', 'En mantenimiento', 'Eliminado']

# STUDENTS
NAMES = ['María', 'José', 'Pablo', 'Carlos', 'Juan', 'Paula', 'Jimena', 'Gonzalo', 'Manuel', 'Mónica', 'Tomás', 'Leonardo', 'Adriana', 'Lucía', 'Mario', 'Mariano', 'Mariana']
SURNAMES = ['Aguilar', 'Agüero', 'Rodríguez', 'García', 'Bonilla', 'Venegas', 'Zúñiga', 'González', 'Gómez', 'Jiménez', 'Bermúdez', 'Méndez', 'Badilla', 'Argüello', 'Retana', 'Rivera']

def random_element(list : list = []):
    """
    Returns a random item from the provided list
    """

    if len(list) < 1:
        return ""
    
    return list[randint(0, len(list) - 1)]

def email_user(name : list = None):
    """
    Returns a username for a given name
    """

    if list == None:
        return ''
    
    return (unidecode(name[0])[0:3] + '.' + unidecode(name[1])).lower()

# GENERATING ADMINS
GEN_ADMINS = []
GEN_EMAILS = []

for admin in range(0, NUM_ADMIN):
    name = None
    
    while name == None or email_user(name) in GEN_EMAILS:
        name = [random_element(NAMES), random_element(SURNAMES)]
    
    GEN_EMAILS.append(email_user(name))

    original_pass = ''.join(chr(randint(33,126)) for i in range(0,randint(10,12))).replace('\'', '"')

    GEN_ADMINS.append(
        {
            'type': USER_TYPES[0],
            'email': email_user(name) + '@itcr.ac.cr',
            'password': bcrypt.hashpw(original_pass.encode(), salt).decode(),
            'og_pass': original_pass
        }
    )

# GENERATING STUDENTS
GEN_STUDENTS = []
GEN_EMAILS = []

for admin in range(0, NUM_STUDENTS):
    name = None
    
    while name == None or email_user(name) in GEN_EMAILS:
        name = [random_element(NAMES), random_element(SURNAMES), random_element(SURNAMES)]
    
    GEN_EMAILS.append(email_user(name))

    original_pass = ''.join(chr(randint(33,126)) for i in range(0,randint(10,12))).replace('\'', '"')
    
    GEN_STUDENTS.append(
        {
            'type': USER_TYPES[1],
            'given_name': name[0],
            'surname_1': name[1],
            'surname_2': name[2],
            'date_of_birth': str(randint(1995,2004)) + '-' + str(randint(1,12)).zfill(2) + '-' + str(randint(1,28)).zfill(2),
            'id': str(randint(1,7)) + str(randint(1,1100)).zfill(4) + str(randint(1,1100)).zfill(4),
            'u_id': str(randint(2010,2023)) + str(randint(0, 200000)).zfill(6),
            'email': email_user(name) + '@estudiantec.cr',
            'password': bcrypt.hashpw(original_pass.encode(), salt).decode(),
            'og_pass': original_pass
        }
    )

# GENERATING ROOMS
GEN_ROOMS = []
GEN_ROOMS_NAMES = []

for room in range(0, NUM_ROOMS):
    services = []
    for service in range(0, randint(0,7)):
        new_service = None
        while new_service == None or new_service in services:
            new_service = random_element(SPECIAL_SERVICES)
        services.append(new_service)

    new_name = chr(randint(65,70)) + str(randint(1,20)).zfill(2)

    while new_name in GEN_ROOMS_NAMES:
        new_name = chr(randint(65,70)) + str(randint(1,20)).zfill(2)

    GEN_ROOMS_NAMES.append(new_name)

    GEN_ROOMS.append(
        {
            'name': new_name,
            'status': ROOM_STATUS[0],
            'capacity': randint(2,8),
            'maxTime': randint(6, 18) * 10,
            'services': services
        }
    )

# GENERATING RESERVATIONS
GEN_RESERVS = []
CURRENT_TIME = datetime.timestamp(datetime.now())

def random_date():
    seconds = randint(0,86400)
    return (
        '2023-' + str(randint(1,12)).zfill(2) + '-' + str(randint(1,28)).zfill(2) + ' '
        + str(seconds//3600).zfill(2) + ":" + str(seconds % 3600 // 60).zfill(2) + ":" + str(seconds % 60).zfill(2)
        )

OPENING_HOURS = [
    [7, 21],
    [7, 21],
    [7, 21],
    [7, 21],
    [7, 20],
    [8, 16]
]

for reserv in range(0, NUM_RESERV):
    active = randint(0, 100) > 10
    confirmed = randint(0, 100) > 60 if active else False

    reserv_date = randint(round(CURRENT_TIME - 86400 * 5), round(CURRENT_TIME + 86400 * 10))
    verified = False
    attempt = 0
    current_room = random_element(GEN_ROOMS)['name']
    current_student = random_element(GEN_STUDENTS)['u_id']

    while not verified:
        if attempt > 5:
            current_room = random_element(GEN_ROOMS)['name']
            attempt = 0
        
        start_date = randint(round(reserv_date / 3600), round(reserv_date / 3600 + 24 * 7)) * 3600
        start_date = datetime.fromtimestamp(start_date)

        while start_date.weekday() == 6:
            start_date = datetime.fromtimestamp(randint(round(reserv_date / 3600), round(reserv_date / 3600 + 24 * 7)) * 3600)

        if start_date.hour < OPENING_HOURS[start_date.weekday()][0]:
            start_date = start_date + timedelta(hours=7-start_date.hour)
        elif start_date.hour > OPENING_HOURS[start_date.weekday()][1]:
            start_date = start_date + timedelta(hours=OPENING_HOURS[start_date.weekday()][1]-randint(1,3)-start_date.hour)

        end_date = randint(round(datetime.timestamp(start_date) / 600 + 3), round(datetime.timestamp(start_date) / 600 + 18)) * 600
        end_date = datetime.fromtimestamp(end_date)

        if end_date.hour >= OPENING_HOURS[start_date.weekday()][1]:
            end_date = end_date + timedelta(
                hours=OPENING_HOURS[start_date.weekday()][1]-end_date.hour,
                minutes=-end_date.minute
                )
            
            if datetime.timestamp(start_date) == datetime.timestamp(end_date):
                start_date = start_date - timedelta(hours=randint(1, 2))

        start_date_ts = datetime.timestamp(start_date)
        end_date_ts = datetime.timestamp(end_date)

        verified = True

        for r in GEN_RESERVS:
            if (r['room'] == current_room
                    and     r['active'] == '1'
                    and    ((start_date_ts >= r['ts_start'] and start_date_ts < r['ts_end'])
                         or (end_date_ts > r['ts_start'] and end_date_ts <= r['ts_end']))):
                attempt = attempt + 1
                verified = False
                break

            while not verified:
                verified = True
                if (r['student_u_id'] == current_student
                        and     r['active'] == '1'
                        and    ((start_date_ts >= r['ts_start'] and start_date_ts < r['ts_end'])
                            or (end_date_ts > r['ts_start'] and end_date_ts <= r['ts_end']))):
                    new_student = random_element(GEN_STUDENTS)['u_id']
                    while new_student == current_student:
                        new_student = random_element(GEN_STUDENTS)['u_id']
                    current_student = new_student
                    verified = False
        
    GEN_RESERVS.append(
        {
            'room': current_room,
            'student_u_id': current_student,
            'date': datetime.fromtimestamp(reserv_date).strftime("%Y-%m-%d %H:%M:%S"),
            'start': start_date.strftime("%Y-%m-%d %H:%M:%S"),
            'end': end_date.strftime("%Y-%m-%d %H:%M:%S"),
            'ts_start': datetime.timestamp(start_date),
            'ts_end': datetime.timestamp(end_date),
            'active': '1' if active and (confirmed or CURRENT_TIME < start_date_ts) else '0',
            'confirmed': '1' if confirmed else '0'
        }
    )

def sort_by_date(e):
    return e['date']

GEN_RESERVS.sort(key=sort_by_date)

# OPENING FILE
output = open(OUTPUT_FILE, 'w', encoding='utf8')

output.write('''DELETE [dbo].[Errors];
DELETE [dbo].[Reservas];
DELETE [dbo].[ServiciosDeCubiculo];
DELETE [dbo].[Estudiantes];
DELETE [dbo].[Usuarios];
DELETE [dbo].[Cubiculos];
DELETE [dbo].[ServiciosEspeciales];
DELETE [dbo].[TiposUsuario];
DELETE [dbo].[EstadosCubiculo];

DBCC CHECKIDENT ('Errors', RESEED, 1);
DBCC CHECKIDENT ('Reservas', RESEED, 1);
DBCC CHECKIDENT ('ServiciosDeCubiculo', RESEED, 1);
DBCC CHECKIDENT ('Estudiantes', RESEED, 1);
DBCC CHECKIDENT ('Usuarios', RESEED, 1);
DBCC CHECKIDENT ('Cubiculos', RESEED, 1);
DBCC CHECKIDENT ('ServiciosEspeciales', RESEED, 1);
DBCC CHECKIDENT ('TiposUsuario', RESEED, 1);
DBCC CHECKIDENT ('EstadosCubiculo', RESEED, 1);
\n''')

output.write('-- ------------------------ CATÁLOGOS ------------------------\n\n')

output.write('-- 1. Tipos de usuario\n')

output.write('''
INSERT INTO [dbo].[TiposUsuario] ([descripcion])
VALUES '''
)

output.write(',\n       '.join(f"('{u_type}')" for u_type in USER_TYPES) + ';')

output.write('\n\n-- 2. Servicios especiales\n')

output.write('''
INSERT INTO [dbo].[ServiciosEspeciales] ([descripcion])
VALUES '''
)

output.write(',\n       '.join(f"('{s_service}')" for s_service in SPECIAL_SERVICES) + ';')

output.write('\n\n-- 3. Estados de los cubículos\n')

output.write('''
INSERT INTO [dbo].[EstadosCubiculo] ([descripcion])
VALUES '''
)

output.write(',\n       '.join(f"('{r_status}')" for r_status in ROOM_STATUS) + ';')

output.write('\n\n-- ---------------------- OTRAS ENTRADAS ---------------------\n')

output.write('''
DECLARE @tmp_Usuarios TABLE
    (
        tipoUsuario VARCHAR(16),
        correo      VARCHAR(128),
        clave       VARCHAR(16),
        cedula      INT NULL,
        carnet      INT NULL,
        nombre      VARCHAR(32) NULL,
        apellido1   VARCHAR(16) NULL,
        apellido2   VARCHAR(16) NULL,
        fechaNac    DATE NULL
    );'''
)

output.write('\n\n-- 4. Usuarios administradores\n')

output.write('''
INSERT INTO @tmp_Usuarios ([tipoUsuario], [correo], [clave])
VALUES '''
)

output.write(',\n       '.join(f"('{admin['type']}', '{admin['email']}', '{admin['password']}')" for admin in GEN_ADMINS) + ';')

output.write('\n\n-- 5. Estudiantes\n')

output.write('''
INSERT INTO @tmp_Usuarios ([tipoUsuario], [correo], [clave], [cedula], [carnet], [nombre], [apellido1], [apellido2], [fechaNac])
VALUES '''
)

output.write(',\n       '.join(
    f"('{s['type']}', '{s['email']}', '{s['password']}', '{s['id']}', '{s['u_id']}', '{s['given_name']}', '{s['surname_1']}', '{s['surname_2']}', '{s['date_of_birth']}')" for s in GEN_STUDENTS) + ';'
    )

output.write('\n\n-- 6. Inserción de los usuarios a partir de la tabla temporal\n')

output.write('-- 6.1. Todos los usuarios\n')

output.write('''
INSERT INTO [Usuarios] ([idTipoUsuario], [correo], [clave])
SELECT  TU.[id],
        tmp_U.[correo],
        tmp_U.[clave]
FROM    @tmp_Usuarios tmp_U
INNER JOIN  [dbo].[TiposUsuario] TU
    ON  tmp_U.[tipoUsuario] = TU.[descripcion];'''
)

output.write('\n\n-- 6.2. Estudiantes\n')

output.write('''
INSERT INTO [Estudiantes] ([idUsuario], [cedula], [carnet], [nombre], [apellido1], [apellido2], [fechaDeNacimiento], [activo])
SELECT  U.[id],
        tmp_U.[cedula], 
        tmp_U.[carnet], 
        tmp_U.[nombre], 
        tmp_U.[apellido1], 
        tmp_U.[apellido2], 
        tmp_U.[fechaNac],
        1
FROM    @tmp_Usuarios tmp_U
INNER JOIN  [dbo].[Usuarios] U
    ON  tmp_U.[correo] = U.[correo]
WHERE   tmp_U.[tipoUsuario] = 'Estudiante';'''
)

output.write('\n\n-- 7. Cubículos\n')

output.write('''
DECLARE @tmp_Cubiculos TABLE
    (
        estado      VARCHAR(16),
        nombre      VARCHAR(16),
        capacidad   INT,
        minutosMax  INT
    );
    
DECLARE @tmp_ServiciosDeCubiculo TABLE
    (
        nombreC     VARCHAR(16),
        servicio    VARCHAR(32)
    );
'''
)

output.write('''
INSERT INTO @tmp_Cubiculos ([estado], [nombre], [capacidad], [minutosMax])
VALUES '''
)

output.write(',\n       '.join(f"('{r['status']}', '{r['name']}', '{r['capacity']}', '{r['maxTime']}')" for r in GEN_ROOMS) + ';\n')

output.write('''
INSERT INTO @tmp_ServiciosDeCubiculo ([nombreC], [servicio])
VALUES '''
)

EXPANDED_SERVICES = []

for r in GEN_ROOMS:
    for s in r['services']:
        EXPANDED_SERVICES.append([r['name'], s])

UTC_OFFSET = -6

output.write(',\n       '.join(f"('{r[0]}', '{r[1]}')" for r in EXPANDED_SERVICES) + ';\n')

output.write('''
INSERT INTO [dbo].[Cubiculos] ([idEstado], [nombre], [capacidad], [minutosMax])
SELECT  EC.[id],
        tmp_C.[nombre],
        tmp_C.[capacidad],
        tmp_C.[minutosMax]
FROM    @tmp_Cubiculos tmp_C
INNER JOIN  [dbo].[EstadosCubiculo] EC
    ON  EC.[descripcion] = tmp_C.[estado];
    
INSERT INTO [dbo].[ServiciosDeCubiculo] ([idCubiculo], [idServiciosEspeciales], [activo])
SELECT  C.[id],
        S.[id],
        1
from    @tmp_ServiciosDeCubiculo tmp_SC
INNER JOIN  [dbo].[Cubiculos] C
    ON  C.[nombre] = tmp_SC.[nombreC]
INNER JOIN  [dbo].[ServiciosEspeciales] S
    ON  S.[descripcion] = tmp_SC.[servicio];'''
)

output.write('\n\n-- 8. Reservas\n')

output.write('''
DECLARE @tmp_Reservas TABLE
    (
        nombreC     VARCHAR(16),
        carnet      INT,
        fecha       DATETIME,
        horaInicio  DATETIME,
        horaFin     DATETIME,
        activo      BIT,
        confirmado  BIT
    );

INSERT INTO @tmp_Reservas ([nombreC], [carnet], [fecha], [horaInicio], [horaFin], [activo], [confirmado])
VALUES '''
)

output.write(',\n       '.join(f"('{r['room']}', '{r['student_u_id']}', '{r['date']}', '{r['start']}', '{r['end']}', '{r['active']}', '{r['confirmed']}')" for r in GEN_RESERVS) + ';\n')

output.write(f'''
INSERT INTO [dbo].[Reservas] ([idCubiculo], [idEstudiante], [fecha], [horaInicio], [horaFin], [activo], [confirmado])
SELECT  C.[id],
        E.[id],
        DATEADD(HOUR, {-UTC_OFFSET}, tmp_R.[fecha]),
        DATEADD(HOUR, {-UTC_OFFSET}, tmp_R.[horaInicio]),
        DATEADD(HOUR, {-UTC_OFFSET}, tmp_R.[horaFin]),
        tmp_R.[activo],
        tmp_R.[confirmado]
FROM    @tmp_Reservas tmp_R
INNER JOIN  [dbo].[Cubiculos] C
    ON  C.[nombre] = tmp_R.[nombreC]
INNER JOIN  [dbo].[Estudiantes] E
    ON  tmp_R.[carnet] = E.[carnet];''')

# CLOSING FILE
output.close()

with open(PASS_FILE, 'w', encoding='utf-8') as output2:
    output2.write('\n'.join(f"{admin['type']}\t{admin['og_pass']}\t{admin['email']}" for admin in GEN_ADMINS))

    output2.write('\n'.join(
        f"{s['type']}\t{s['og_pass']}\t{s['email']}" for s in GEN_STUDENTS)
        )